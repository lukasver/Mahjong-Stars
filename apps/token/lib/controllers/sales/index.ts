import 'server-only';
import {
  ActionCtx,
  GetSaleDto,
  GetSalesDto,
  SaleInformationItem,
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
import { DEFAULT_SALE_SELECT, TOKEN_QUERY } from './queries';
import { SaleWithRelations, SaleWithToken } from '@/common/types/sales';

const QUERY_MAPPING: { active: Prisma.SaleFindFirstArgs } = {
  active: {
    where: {
      status: SaleStatus.OPEN,
    },
    select: DEFAULT_SALE_SELECT,
  },
};

class SalesController {
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
    let query = {};
    const isActiveSaleReq = active;
    if (isActiveSaleReq) {
      query = QUERY_MAPPING['active'];
    }
    let sales: Sale[] = [];
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
          sales = await changeActiveSaleToFinish(activeSale);
        }
      }

      return Success({
        sales: sales.map((sale) =>
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
          SaleInformationItem & { fileName: string; mimeType: string }
        >;
      } = { documents: [], images: [] };

      if (information) {
        const pInformation = SaleInformationItem.array().parse(information);

        pInformation.reduce((acc, item) => {
          if (item.type === 'file') {
            const fileName = item.value.split('/').pop() || '';
            const mimeType = mime.lookup(fileName);

            if (mimeType && mimeType?.startsWith('image/')) {
              acc.images.push({ ...item, fileName, mimeType });
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
        await Promise.all([
          docs.images?.length
            ? tx.document.createMany({
                data: docs.images.map((image) => ({
                  name: image.label,
                  url: image.value,
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
                  url: doc.value,
                  type: doc.mimeType,
                  fileName: doc.fileName,
                  saleId: sale.id,
                })),
              })
            : Promise.resolve(),
        ]);
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
      const [currencies, blockchains, tokens] = await Promise.all([
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
            acc.images.push(doc);
          } else {
            acc.documents.push(doc);
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

  private parseTokenData(data: Partial<SaleWithRelations>): SaleWithToken {
    const cloned = structuredClone(data) as unknown as SaleWithToken;
    cloned.token = {
      chainId: data?.token?.TokensOnBlockchains?.[0]?.chainId,
      contractAddress: data?.token?.TokensOnBlockchains?.[0]?.contractAddress,
      decimals: data?.token?.TokensOnBlockchains?.[0]?.decimals,
      symbol: data?.token?.symbol,
      image: data?.token?.image,
    };
    return cloned;
  }
}

export default new SalesController();
