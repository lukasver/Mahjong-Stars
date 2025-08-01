import 'server-only';
import {
  ActionCtx,
  GetSaleDto,
  GetSalesDto,
} from '@/common/schemas/dtos/sales';
import {
  CreateSaleDto,
  DeleteSaleDto,
  UpdateSaleDto,
  UpdateSaleStatusDto,
} from '@/common/schemas/dtos/sales';
import { Failure, Success } from '@/common/schemas/dtos/utils';
import { isObject } from '@/common/schemas/dtos/utils';
import { prisma } from '@/db';
import logger from '@/lib/services/logger.server';
import { invariant } from '@epic-web/invariant';
import { Prisma, SaftContract, Sale, SaleStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import {
  changeActiveSaleToFinish,
  checkSaleDateIsNotExpired,
} from './functions';
import { FIAT_CURRENCIES } from '@/common/config/constants';
import mime from 'mime-types';
import { Document } from '@/common/schemas/generated';
import {
  DEFAULT_SALE_SELECT,
  GetSalesArgs,
  SalesWithRelations,
  TOKEN_QUERY,
} from './queries';
import { SaleWithRelations, SaleWithToken } from '@/common/types/sales';
import { z } from 'zod';
import { SaleInformationItem } from '@/common/schemas/dtos/sales/information';
import { StorageService } from '../documents/storage';
import { BankDetailsForm } from '@/components/admin/create-sales/utils';

const QUERY_MAPPING = {
  active: {
    where: {
      status: SaleStatus.OPEN,
    },
    select: DEFAULT_SALE_SELECT,
  },
} as const;

class SalesController {
  private storage: StorageService;
  constructor(storage: StorageService) {
    this.storage = storage;
  }

  async getSales(
    { active }: GetSalesDto = { active: false },
    _ctx?: ActionCtx
  ): Promise<
    | Success<{
        sales: SaleWithToken[];
        quantity: number;
      }>
    | Failure
  > {
    const isActiveSaleReq = active;
    let query: GetSalesArgs = { select: DEFAULT_SALE_SELECT };
    if (isActiveSaleReq) {
      query = QUERY_MAPPING['active'];
    }
    let sales: SalesWithRelations[] = [];
    try {
      sales = await prisma.sale.findMany({
        ...query,
        orderBy: [{ createdAt: 'desc' }],
      });

      sales = sales.sort((a, b) => {
        const statusOrder = { CREATED: 1, OPEN: 0, CLOSED: 2, FINISHED: 3 };
        const statusComparison = statusOrder[a.status] - statusOrder[b.status];

        if (statusComparison === 0) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        return statusComparison;
      });

      if (isActiveSaleReq && sales?.length) {
        const activeSale = sales[0];

        invariant(activeSale, 'Active sale not found');
        const isSaleFinished =
          DateTime.fromJSDate(activeSale.saleClosingDate) <= DateTime.now();
        const isSaleCompleted =
          activeSale.availableTokenQuantity &&
          activeSale.availableTokenQuantity < 0;
        // if sale closing date is expired or no more available units to sell, then update status to finished.
        if (isSaleFinished || isSaleCompleted) {
          await changeActiveSaleToFinish(activeSale);
          sales = [];
        }
      }

      sales.forEach((sale) => {
        if (sale.banner?.url) {
          sale.banner.url = this.storage.getFileUrl('public', sale.banner.url, {
            encode: true,
          });
        }
        // @ts-expect-error FIXME
        sale.information =
          sale.information && Array.isArray(sale.information)
            ? (sale.information as SaleInformationItem[]).map((info) => {
                if (info.type === 'file') {
                  info.value = this.storage.getFileUrl(
                    'public',
                    info.value as string
                  );
                }
                return info;
              })
            : sale.information;
      });

      return Success({
        sales: sales.map((sale) =>
          // @ts-expect-error FIXME
          this.decimalsToString(this.parseTokenData(sale))
        ),
        quantity: sales?.length,
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * Recursively converts all Prisma.Decimal instances in an object to strings.
   * Leaves other object types (like Date) untouched.
   * @param value - The input object or value to process.
   * @returns The object with all Prisma.Decimal instances converted to strings.
   */
  private decimalsToString<T>(value: T): T {
    const { Decimal } = Prisma;
    function isPlainObject(val: unknown): val is Record<string, unknown> {
      return isObject(val) && Object.getPrototypeOf(val) === Object.prototype;
    }
    function convert(val: unknown): unknown {
      if (val instanceof Decimal) {
        return val.toString();
      }
      if (Array.isArray(val)) {
        return val.map(convert);
      }
      if (isPlainObject(val)) {
        const obj = val as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = convert(obj[key]);
          }
        }
        return result;
      }
      return val;
    }
    return convert(value) as T;
  }

  /**
   * Fetch a single sale and its information by id.
   * @param dto - The DTO containing the sale id.
   * @param _ctx - The action context (unused).
   * @returns Success with sale and saleInformation, or Failure on error.
   */
  async getSale(
    { id }: GetSaleDto,
    _ctx: ActionCtx
  ): Promise<
    | Success<{
        sale: SaleWithToken;
      }>
    | Failure
  > {
    if (!id) {
      return Failure('Sale id missing', 400, 'Sale id missing');
    }
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: String(id) },
      });
      invariant(sale, 'Sale not found in DB');

      return Success({
        sale: this.decimalsToString(this.parseTokenData(sale)),
      });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  /**
   * Create a new sale.
   */
  async createSale(
    dto: CreateSaleDto,
    ctx: ActionCtx
  ): Promise<Success<{ sale: Sale }> | Failure> {
    try {
      const {
        name,
        tokenName,
        tokenSymbol,
        tokenContractAddress,
        tokenPricePerUnit,
        toWalletsAddress,
        currency,
        saleStartDate,
        saleClosingDate,
        initialTokenQuantity,
        availableTokenQuantity,
        minimumTokenBuyPerUser,
        maximumTokenBuyPerUser,
        tokenContractChainId,
        saftCheckbox,
      } = dto;
      if (Number.isNaN(Number(tokenPricePerUnit))) {
        return Failure(
          'Invalid value as price per unit',
          400,
          'Invalid value as price per unit'
        );
      }
      // TODO! should validate from the model
      // if (!Object.values(Currency).includes(saleCurrency as Currency)) {
      //   return Failure('Invalid sale currency', 400, 'Invalid sale currency');
      // }
      invariant(
        FIAT_CURRENCIES.includes(currency as (typeof FIAT_CURRENCIES)[number]),
        'Invalid sale currency'
      );
      invariant(tokenContractChainId, 'Token contract chain id is required');
      invariant(ctx.userId, 'User id is required');

      // First we check if the token configuration exists in DB or if is new
      const tob = await prisma.tokensOnBlockchains.upsert({
        where: {
          tokenSymbol_chainId: {
            tokenSymbol,
            chainId: tokenContractChainId,
          },
        },
        create: {
          blockchain: {
            connect: {
              chainId: tokenContractChainId,
            },
          },
          name: tokenName,
          //TODO! REVISE THIS
          decimals: 18,
          token: {
            create: {
              symbol: tokenSymbol,
            },
          },
        },
        update: {},
        select: {
          token: {
            select: {
              id: true,
              symbol: true,
            },
          },
        },
      });

      const sale = await prisma.sale.create({
        data: {
          name,
          saleStartDate: new Date(saleStartDate),
          saleClosingDate: new Date(saleClosingDate),
          tokenName,
          tokenContractAddress,
          tokenPricePerUnit: parseFloat(Number(tokenPricePerUnit).toFixed(2)),
          toWalletsAddress,
          initialTokenQuantity,
          availableTokenQuantity,
          minimumTokenBuyPerUser,
          maximumTokenBuyPerUser,
          saftCheckbox,
          documents: {},
          user: {
            connect: {
              walletAddress: ctx.address,
            },
          },
          saleCurrency: {
            connect: {
              symbol: currency,
            },
          },
          blockchain: {
            connect: {
              chainId: tokenContractChainId,
            },
          },
          token: {
            connect: {
              id: tob.token.id,
              symbol: tob.token.symbol,
            },
          },
        },
        select: {
          ...DEFAULT_SALE_SELECT,
        },
      });
      if (!sale) {
        return Failure(
          'Error while creating sale',
          500,
          'Error while creating sale'
        );
      }
      return Success({ sale: this.decimalsToString(sale) }, { status: 201 });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  /**
   * Update the status of a sale.
   */
  async updateSaleStatus(
    { id, status }: UpdateSaleStatusDto,
    _ctx: ActionCtx
  ): Promise<Success<{ sale: Sale }> | Failure> {
    if (!id) {
      return Failure('Sale id missing', 400, 'Sale id missing');
    }
    if (!status || !Object.keys(SaleStatus).includes(String(status))) {
      return Failure(
        `Status should be one of: ${Object.keys(SaleStatus).join(' ')}`,
        400
      );
    }
    if (status === SaleStatus.OPEN) {
      const openSale = await prisma.sale.findFirst({
        where: { status: SaleStatus.OPEN },
      });
      if (openSale) {
        return Failure(
          'Cannot have more than one sale open at same time',
          409,
          'Cannot have more than one sale open at same time'
        );
      }
    }
    try {
      const sale = await prisma.sale.findFirst({
        where: { id: String(id) },
      });
      invariant(sale, 'Sale not found in DB');
      if (status === SaleStatus.OPEN) {
        checkSaleDateIsNotExpired(sale);
      }
      const updatedSale = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: status as SaleStatus },
      });
      return Success({
        sale: this.decimalsToString(updatedSale),
      });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  /**
   * Update a sale.
   */
  async updateSale(
    { id, data }: UpdateSaleDto,
    _ctx: ActionCtx
  ): Promise<Success<{ sale: SaleWithToken }> | Failure> {
    if (!id || !data || data === undefined) {
      return Failure(
        'Invalid request parameters',
        400,
        'Invalid request parameters'
      );
    }

    const {
      currency,
      tokenContractChainId,
      tokenId,
      tokenSymbol,
      createdBy,
      information,
      ...rest
    } = data;

    // @ts-expect-error FIXME issue with the discriminated union
    const updateData: Prisma.SaleUpdateInput = {
      ...rest,
      ...(information && {
        information,
      }),
      //TODO! amend rest of info
    };

    try {
      const sale = await prisma.sale.findFirst({
        where: { id: String(id) },
      });

      invariant(sale, 'Sale not found in DB');

      // Find if there are any documents inside information
      const docs: {
        documents: Array<
          SaleInformationItem & { fileName: string; mimeType: string }
        >;
        images: Array<
          SaleInformationItem & {
            fileName: string;
            mimeType: string;
            isBanner?: boolean;
            isTokenImage?: boolean;
          }
        >;
      } = { documents: [], images: [] };

      if (information) {
        const pInformation = z.array(SaleInformationItem).parse(information);

        pInformation.reduce((acc, item) => {
          if (item.type === 'file') {
            const fileName = (item.value as string).split('/').pop() || '';
            const mimeType = mime.lookup(fileName);

            if (mimeType && mimeType?.startsWith('image/')) {
              acc.images.push({
                ...item,
                fileName,
                mimeType,
                isBanner: item.props?.isBanner,
                isTokenImage: item.props?.isTokenImage,
              });
            } else {
              acc.documents.push({
                ...item,
                fileName,
                mimeType: mimeType || 'application/octet-stream',
              });
            }
          }
          return acc;
        }, docs);
      }

      const updatedSale = await prisma.$transaction(async (tx) => {
        // handle banner and token image creation individually
        let individualPromises: Promise<unknown>[] = [];
        if (docs.images?.length) {
          const separated = docs.images.filter(
            (image) => image.isBanner || image.isTokenImage
          );
          docs.images = docs.images.filter(
            (image) => !image.isBanner && !image.isTokenImage
          );
          if (separated?.length) {
            individualPromises = separated
              .map((doc) => {
                if (doc.isBanner) {
                  return tx.document.create({
                    data: {
                      name: doc.label,
                      url: doc.value as string,
                      type: doc.mimeType,
                      fileName: doc.fileName,
                      sale: {
                        connect: {
                          id: sale.id,
                        },
                      },
                      saleBanner: {
                        connect: {
                          id: sale.id,
                        },
                      },
                    },
                  });
                }
                if (doc.isTokenImage) {
                  return tx.document
                    .create({
                      data: {
                        name: doc.label,
                        url: doc.value as string,
                        type: doc.mimeType,
                        fileName: doc.fileName,
                        sale: {
                          connect: {
                            id: sale.id,
                          },
                        },
                      },
                    })
                    .then(async (d) => {
                      await tx.token.update({
                        where: {
                          id: sale.tokenId,
                        },
                        data: {
                          image: d.url,
                        },
                      });
                      return d;
                    });
                }
              })
              .filter(Boolean);
          }
        }

        await Promise.allSettled(
          individualPromises.concat([
            docs.images?.length
              ? tx.document.createMany({
                  data: docs.images.map((image) => ({
                    name: image.label,
                    url: image.value as string,
                    type: image.mimeType,
                    fileName: image.fileName,
                    saleId: sale.id,
                  })),
                })
              : Promise.resolve(),
            docs.documents?.length
              ? tx.document.createMany({
                  data: docs.documents.map((doc) => ({
                    name: doc.label,
                    url: doc.value as string,
                    type: doc.mimeType,
                    fileName: doc.fileName,
                    saleId: sale.id,
                  })),
                })
              : Promise.resolve(),
          ])
        );

        return tx.sale.update({
          where: { id: sale.id },
          data: updateData,
        });
      });

      return Success({
        sale: this.decimalsToString(this.parseTokenData(updatedSale)),
      });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  /**
   * Delete a sale.
   */
  async deleteSale(
    { id }: DeleteSaleDto,
    _ctx: ActionCtx
  ): Promise<Success<{ id: string }> | Failure> {
    if (!id) {
      return Failure('Sale id missing', 400, 'Sale id missing');
    }
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: String(id) },
        include: { transactions: true },
      });
      if (!sale) {
        return Failure('Sale not found', 400, 'Sale not found');
      }
      if (sale?.transactions?.length) {
        return Failure(
          'Cannot delete a sale with transactions associated. Change status to closed instead',
          400
        );
      }
      if (sale.status === SaleStatus.OPEN) {
        return Failure(
          'Cannot delete an OPEN sale, update its status instead',
          400
        );
      }
      await prisma.sale.delete({ where: { id: String(id) } });
      return Success({ id }, { status: 202 });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  async getInputOptions(_ctx: ActionCtx) {
    try {
      const [currencies, blockchains, tokens, banks] = await Promise.all([
        prisma.currency.findMany({
          select: {
            symbol: true,
            name: true,
            type: true,
            id: true,
          },
        }),
        prisma.blockchain.findMany({
          select: {
            id: true,
            chainId: true,
            name: true,
          },
        }),
        prisma.token.findMany({
          select: {
            symbol: true,
            id: true,
            TokensOnBlockchains: {
              select: {
                name: true,
                chainId: true,
              },
            },
          },
        }),
        prisma.bankDetails.findMany({
          select: {
            id: true,
            bankName: true,
            accountName: true,
            iban: true,
            swift: true,
            address: true,
            memo: true,
            currency: {
              select: {
                symbol: true,
              },
            },
          },
        }),
      ]);

      type SelectOption = {
        meta?: Record<string, unknown>;
        id: string;
        value: string;
        label: string;
      };
      return Success({
        ...currencies.reduce(
          (agg, c) => {
            const recipient =
              c.type === 'FIAT' ? 'fiatCurrencies' : 'cryptoCurrencies';
            agg[recipient].push({
              meta: {
                type: c.type,
              },
              id: c.symbol,
              value: c.symbol,
              label: c.symbol,
            });
            return agg;
          },
          {
            fiatCurrencies: [] as SelectOption[],
            cryptoCurrencies: [] as SelectOption[],
          }
        ),
        blockchain: blockchains.map(({ chainId, name, id }) => ({
          id,
          value: chainId,
          label: name,
        })),
        token: tokens.map(({ symbol, TokensOnBlockchains, id }) => ({
          meta: {
            chainId: TokensOnBlockchains[0]?.chainId,
          },
          id: id,
          value: symbol,
          label: TokensOnBlockchains[0]?.name || symbol,
        })),
        banks: banks.map((b) => ({
          id: b.id,
          value: b.bankName,
          label: `${b.bankName} (${b.iban})`,
          meta: {
            accountName: b.accountName,
            iban: b.iban,
            swift: b.swift,
            address: b.address,
            memo: b.memo,
            currency: b.currency?.symbol,
            bankName: b.bankName,
          },
        })),
      });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  async getSaleSaftContract(id: string) {
    try {
      invariant(id, 'Sale id is required');
      const data = await prisma.sale.findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          id: true,
          saftContract: true,
        },
      });

      const saft = data.saftContract?.isCurrent ? data.saftContract : null;
      let versions: SaftContract[] = [];
      if (saft && saft.version > 1) {
        versions = await prisma.saftContract.findMany({
          where: {
            OR: [
              {
                parentId: saft?.parentId || saft?.id,
              },
              {
                parentId: null,
              },
            ],
          },
          orderBy: {
            version: 'desc',
          },
        });
      }
      return Success({
        saft,
        versions,
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getSaleDocuments(id: string) {
    try {
      invariant(id, 'Sale id is required');
      const data = await prisma.sale.findUniqueOrThrow({
        where: { id },
        select: {
          documents: true,
        },
      });

      const documents = data.documents.reduce(
        (acc: { images: Document[]; documents: Document[] }, doc) => {
          if (doc.type.startsWith('image/')) {
            acc.images.push({
              ...doc,
              url: this.storage.getFileUrl('public', doc.url),
            });
          } else {
            acc.documents.push({
              ...doc,
              url: this.storage.getFileUrl('public', doc.url),
            });
          }
          return acc;
        },
        { images: [], documents: [] }
      );

      return Success(documents);
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getSaleInvestInfo(id: string) {
    try {
      const data = await prisma.sale.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          blockchain: {
            select: {
              chainId: true,
              name: true,
            },
          },
          token: TOKEN_QUERY,
          tokenPricePerUnit: true,
          tokenContractAddress: true,
          status: true,
          currency: true,
          initialTokenQuantity: true,
          availableTokenQuantity: true,
          maximumTokenBuyPerUser: true,
          minimumTokenBuyPerUser: true,
          saleStartDate: true,
          tokenSymbol: true,
          saleClosingDate: true,
          saftCheckbox: true,
          requiresKYC: true,
        },
      });

      const parsedToken = this.parseTokenData(data);
      return Success({
        sale: this.decimalsToString({ ...data, token: parsedToken }),
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async associateBankDetailsToSale(
    { banks, saleId }: { banks: BankDetailsForm[]; saleId: string },
    _ctx: ActionCtx
  ) {
    try {
      const sale = await prisma.sale.findUniqueOrThrow({
        where: { id: saleId },
        select: {
          id: true,
        },
      });

      const existing = banks.filter((bank) => bank.id);

      if (existing.length) {
        await Promise.all(
          existing.map(async (bank) => {
            await prisma.bankDetails.update({
              where: { id: bank.id as string },
              data: {
                ...bank,
                currency: {
                  connect: {
                    symbol: bank.currency,
                  },
                },
                sales: {
                  connect: {
                    id: saleId,
                  },
                },
              },
            });
          })
        );
      }
      const nonExisting = banks.filter((bank) => !bank.id);
      if (nonExisting.length) {
        await Promise.all(
          nonExisting.map(async ({ currency, ...bank }) => {
            await prisma.bankDetails.create({
              data: {
                ...bank,
                currency: {
                  connect: {
                    symbol: currency,
                  },
                },
                sales: {
                  connect: {
                    id: saleId,
                  },
                },
              },
            });
          })
        );
      }

      return Success({ sale });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async disassociateBankDetailsFromSale(
    { saleId, bankId }: { saleId: string; bankId: string | string[] },
    _ctx: ActionCtx
  ): Promise<Success<{ saleId: string }> | Failure> {
    try {
      invariant(saleId, 'Sale id is required');
      invariant(bankId, 'Bank id is required');

      await prisma.sale.findUniqueOrThrow({
        where: { id: saleId },
        select: {
          id: true,
        },
      });

      // Disconnect specific bank details from the sale
      const bankIds = Array.isArray(bankId) ? bankId : [bankId];

      // For many-to-many relationships, we need to update each bank detail individually
      await Promise.all(
        bankIds.map(async (bankId) => {
          await prisma.bankDetails.update({
            where: {
              id: bankId,
            },
            data: {
              sales: {
                disconnect: {
                  id: saleId,
                },
              },
            },
          });
        })
      );

      return Success({ saleId });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async getSaleBanks(saleId: string, _ctx: ActionCtx) {
    try {
      const data = await prisma.bankDetails.findMany({
        where: { sales: { some: { id: saleId } } },
        select: {
          id: true,
          bankName: true,
          accountName: true,
          iban: true,
          swift: true,
          address: true,
          memo: true,
          currency: {
            select: {
              symbol: true,
            },
          },
        },
      });

      return Success({
        banks: data.map((b) => ({
          ...b,
          currency: b.currency?.symbol,
        })),
      });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  private parseTokenData(data: Partial<SaleWithRelations>): SaleWithToken {
    const tokenData = {
      chainId: data?.token?.TokensOnBlockchains?.[0]?.chainId,
      contractAddress: data?.token?.TokensOnBlockchains?.[0]?.contractAddress,
      decimals: data?.token?.TokensOnBlockchains?.[0]?.decimals,
      symbol: data?.token?.symbol,
      image: data?.token?.image
        ? this.storage.getFileUrl('public', data?.token?.image)
        : null,
    };
    return Object.assign(data, { token: tokenData }) as SaleWithToken;
  }
}

export default new SalesController(new StorageService());
