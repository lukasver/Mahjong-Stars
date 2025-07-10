import { ROLES } from '@/common/config/constants';
import { invariant } from '@epic-web/invariant';
import { Prisma, PrismaClient, SaleStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { defineChain } from 'thirdweb';
import { bscTestnet } from 'thirdweb/chains';
import sales from '../../data/sales.json';

export async function seedOpenSale(prisma: PrismaClient) {
  invariant(
    process.env.NEXT_PUBLIC_MAIN_WALLET,
    'NEXT_PUBLIC_SMAT_WALLET is not set'
  );

  const user = await prisma.user.findUnique({
    where: {
      walletAddress: process.env.NEXT_PUBLIC_MAIN_WALLET,
      userRole: {
        some: {
          role: {
            name: {
              in: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
            },
          },
        },
      },
    },
  });
  invariant(user, 'User not found');

  const token = await prisma.tokensOnBlockchains.findFirst({
    where: {
      blockchain: {
        chainId: defineChain(bscTestnet.id).id,
      },
      token: {
        symbol: 'tMJS',
      },
    },
    include: {
      token: true,
      blockchain: true,
    },
  });
  invariant(token, 'Token not found');

  const response = await prisma.sale.create({
    data: {
      name: 'Test PreSale',
      saleStartDate: DateTime.now().toISO(),
      saleClosingDate: DateTime.now().plus({ year: 1 }).toISO(),
      tokenName: token.name,
      // tokenSymbol: token.token.symbol,
      initialTokenQuantity: 29_166_667,
      // When created should be the same as initialTokenQuantity
      availableTokenQuantity: 29_166_667,
      toWalletsAddress: process.env.NEXT_PUBLIC_TEST_WALLET!,
      tokenPricePerUnit: Prisma.Decimal('0.012'),
      saftCheckbox: false,
      status: SaleStatus.OPEN,
      tokenContractAddress: token.contractAddress,
      maximumTokenBuyPerUser: 10_000,
      minimumTokenBuyPerUser: 1,
      tokenTotalSupply: '29166667',
      token: {
        connect: {
          id_symbol: {
            id: token.token.id,
            symbol: token.token.symbol,
          },
        },
      },
      saleCurrency: {
        connect: {
          symbol: 'USD',
        },
      },
      blockchain: {
        connect: {
          id: token.blockchain.id,
        },
      },
      user: {
        connect: {
          id: user.id!,
        },
      },
      documents: {
        create: {
          name: 'Cover Picture',
          fileName: 'coverPicture.png',
          url: token.token.image || '',
          type: 'image/png',
          user: {
            connect: {
              id: user.id!,
            },
          },
        },
      },
    },
  });

  const salesTokens = Array.from(
    new Map(
      sales.map((s) => [
        s.tokenSymbol,
        {
          chainId: s.tokenContractChainId,
          symbol: s.tokenSymbol,
          name: s.tokenName,
        },
      ])
    ).values()
  );

  // Check if we have already the token in the DB
  const mjsTokens = await prisma.token.findMany({
    where: {
      symbol: {
        in: salesTokens.map((s) => s.symbol),
      },
      TokensOnBlockchains: {
        some: {
          chainId: {
            in: salesTokens.map((s) => s.chainId).filter(Boolean),
          },
        },
      },
    },
  });

  // Filter out the ones that need to be created
  const toCreate = salesTokens.filter(
    (s) => !mjsTokens.some((t) => t.symbol === s.symbol)
  );

  // Create the tokens that are not in the DB
  const createdTokens = await Promise.all(
    toCreate.map((s) =>
      prisma.token.create({
        data: {
          symbol: s.symbol,
        },
      })
    )
  );

  // Create a mapping of the tokens
  const tokensMapping = new Map(createdTokens.map((t) => [t.symbol, t.id]));

  await Promise.all(
    sales.map(
      async ({ currency, tokenSymbol, tokenContractChainId, ...sale }) => {
        await prisma.sale.create({
          data: {
            ...sale,
            status: SaleStatus.CREATED,
            token: {
              connectOrCreate: {
                where: {
                  id_symbol: {
                    id: tokensMapping.get(tokenSymbol)!,
                    symbol: tokenSymbol,
                  },
                },
                create: {
                  symbol: tokenSymbol,
                },
              },
            },
            saleCurrency: {
              connect: {
                symbol: 'USD',
              },
            },
            ...(tokenContractChainId
              ? {
                  blockchain: {
                    connect: {
                      chainId: defineChain(tokenContractChainId).id,
                    },
                  },
                }
              : {}),
            user: {
              connect: {
                id: user.id!,
              },
            },
            documents: {
              create: {
                name: 'Cover Picture',
                fileName: 'coverPicture.png',
                url: token.token.image || '',
                type: 'image/png',
                user: {
                  connect: {
                    id: user.id!,
                  },
                },
              },
            },
          },
        });
      }
    )
  );

  console.debug(`Sale created: ${response?.name} - ${response.id}`);
}
