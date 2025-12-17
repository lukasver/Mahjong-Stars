import { faker } from "@faker-js/faker";
import {
  Prisma,
  PrismaClient,
  Profile,
  Sale,
  TransactionStatus,
} from "@prisma/client";
import { defineChain } from "thirdweb";
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from "@/common/config/constants";
import { GetExchangeRate } from "@/common/schemas/dtos/rates";
import {
  CurrencyTypeSchema,
  FOPSchema,
  SaleStatusSchema,
  SaleTransactions,
  User,
} from "@/common/schemas/generated";
import {
  ALLOWED_CHAINS,
  NETWORK_TO_TOKEN_MAPPING,
} from "@/lib/services/crypto/config";

const Decimal = Prisma.Decimal;

export const mockExchangeRates: GetExchangeRate = {
  // BTC: {
  //   USD: 61303.99,
  //   EUR: 56678.93,
  //   CHF: 53962.4,
  //   ETH: 17.99,
  //   BTC: 1,
  //   USDC: 61303.42
  // },
  ETH: {
    USD: 3407,
    EUR: 3148.78,
    CHF: 3005.43,
    ETH: 1,
    // BTC: 0.05559,
    USDC: 3407.37,
  },
  EUR: {
    USD: 1.081,
    EUR: 1,
    CHF: 0.9543,
    ETH: 0.0003176,
    // BTC: 0.00001764,
    USDC: 1.081,
  },
  USD: {
    USD: 1,
    EUR: 0.9252,
    CHF: 0.8824,
    ETH: 0.0002935,
    // BTC: 0.00001631,
    USDC: 1,
  },
  CHF: {
    USD: 1.133,
    EUR: 1.048,
    CHF: 1,
    ETH: 0.0003335,
    // BTC: 0.00001853,
    USDC: 1.133,
  },
  USDC: {
    USD: 0.9998,
    EUR: 0.9252,
    CHF: 0.8823,
    ETH: 0.0002935,
    // BTC: 0.00001631,
    USDC: 1,
  },
};



type MockTransactionPayload = Partial<Prisma.SaleTransactionsCreateInput> | Partial<Prisma.SaleTransactionsCreateManyInput>;

export function mockTransactions(
  data?: Partial<SaleTransactions>,
  mode?: 'default',
): SaleTransactions;
export function mockTransactions(
  data: Partial<Prisma.SaleTransactionsCreateManyInput> & { userId: string; saleId: string },
  mode: 'createMany',
): Prisma.SaleTransactionsCreateManyInput;
export function mockTransactions(
  data: Partial<Prisma.SaleTransactionsCreateInput>,
  mode: 'create',
): Prisma.SaleTransactionsCreateInput
export function mockTransactions(
  data: Partial<SaleTransactions> | (MockTransactionPayload & { userId?: string; saleId?: string }) = {},
  mode: 'default' | 'createMany' | 'create' = 'default',
): SaleTransactions | Prisma.SaleTransactionsCreateManyInput | Prisma.SaleTransactionsCreateInput {
  const status = faker.helpers.arrayElement(Object.values(TransactionStatus));
  const currency = faker.helpers.arrayElement([
    ...FIAT_CURRENCIES,
    ...CRYPTO_CURRENCIES,
  ]);
  const isCrypto = CRYPTO_CURRENCIES.includes(currency);
  const q = Decimal(faker.number.int({ min: 1, max: 9999 }));
  const paid = new Decimal(
    faker.number.float({
      min: 0.0001,
      max: 999999999,
      fractionDigits: isCrypto ? 8 : 4,
    }),
  );

  const decimals = isCrypto ? 8 : 4;
  const computed = {
    quantity: q,
    amountPaid: paid.toFixed(decimals),
    price: paid.div(q),
    totalAmountCurrency: currency,
    paidCurrency: currency,
    totalAmount: paid,
  };

  if (mode === 'createMany') {
    const { userId, saleId, metadata, ...rest } = data;
    return {
      tokenSymbol: faker.word.noun({ length: { min: 3, max: 5 } }),
      formOfPayment: isCrypto ? FOPSchema.enum.CRYPTO : FOPSchema.enum.TRANSFER,
      receivingWallet: faker.finance.ethereumAddress(),
      status,
      userId: userId!,
      saleId: saleId!,
      comment: faker.datatype.boolean() ? faker.lorem.lines(1) : null,
      ...(metadata ? { metadata } : {}),
      ...computed,
      ...rest,
    } satisfies Prisma.SaleTransactionsCreateManyInput;
  }

  if (mode === 'create') {
    const { userId: _, saleId: __, metadata, ...rest } = data;
    const { paidCurrency, ...restComputed } = computed;
    return {
      id: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      deletedAt: null,
      tokenSymbol: faker.word.noun({ length: { min: 3, max: 5 } }),
      formOfPayment: isCrypto ? FOPSchema.enum.CRYPTO : FOPSchema.enum.TRANSFER,
      receivingWallet: faker.finance.ethereumAddress(),
      amountPaidCurrency: {
        connect: {
          symbol: paidCurrency,
        },
      },
      user: {
        connect: {
          id: data.userId,
        },
      },
      sale: {
        connect: {
          id: data.saleId,
        },
      },
      ...(metadata ? { metadata } : {}),
      ...restComputed,
      ...rest
    } satisfies Prisma.SaleTransactionsCreateInput;
  }



  const { metadata, createdAt, updatedAt, deletedAt, paymentDate, ...rest } = data;
  return {
    id: faker.string.uuid(),
    createdAt: new Date((createdAt ?? faker.date.past())),
    updatedAt: new Date((updatedAt ?? faker.date.recent())),
    deletedAt: (deletedAt ? new Date(deletedAt) : null),
    tokenSymbol: faker.word.noun({ length: { min: 3, max: 5 } }),
    formOfPayment: isCrypto ? FOPSchema.enum.CRYPTO : FOPSchema.enum.TRANSFER,
    receivingWallet: faker.finance.ethereumAddress(),
    status,
    userId: faker.database.mongodbObjectId(),
    saleId: faker.database.mongodbObjectId(),
    comment: faker.datatype.boolean() ? faker.lorem.lines(1) : null,
    approvedBy: null,
    txHash: isCrypto ? faker.finance.ethereumAddress() : null,
    agreementId: null,
    blockchainId: null,
    rejectionReason: null,
    paymentEvidenceId: null,
    paymentDate: (paymentDate ? new Date(paymentDate) : null),
    ...(metadata ? { metadata: metadata as Prisma.JsonValue } : { metadata: {} as Prisma.JsonValue }),
    ...rest,
    ...computed,
  } satisfies SaleTransactions;
};

export const mockUsers = (data?: Partial<User>) => {
  const wallet = faker.finance.ethereumAddress();
  const fullname = faker.person.fullName();
  const email = faker.internet.email();

  return {
    email: email,
    emailVerified: true,
    name: fullname,
    walletAddress: wallet,
    isSiwe: true,
    ...data,
  } satisfies Pick<
    Prisma.UserCreateInput,
    "id" | "email" | "emailVerified" | "name" | "walletAddress" | "isSiwe"
  >;
};

export const mockProfile = (data?: Partial<Profile>) => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phoneNumber: faker.phone.number(),
    dateOfBirth: faker.date.past(),
    ...data,
  } satisfies Pick<
    Prisma.ProfileCreateInput,
    "firstName" | "lastName" | "phoneNumber" | "dateOfBirth"
  >;
};

export const mockContract = (
  data?: Partial<{ isSign: boolean; urlSign: null | string }>,
  probability = 0.5,
) => {
  return {
    isSign: faker.datatype.boolean({
      probability: Number.isInteger(probability)
        ? probability / 100
        : probability,
    }),
    urlSign: null,
    ...data,
  };
};

export const generateMockSale = (data?: Partial<Prisma.SaleCreateInput>) => {
  return {
    availableTokenQuantity: faker.number.int({ min: 10000, max: 99999 }),
    createdAt: faker.date.past(),
    maximumTokenBuyPerUser: null,
    minimumTokenBuyPerUser: 1,
    name: faker.lorem.words(3),
    saftCheckbox: faker.datatype.boolean(),
    requiresKYC: faker.datatype.boolean(),
    saleClosingDate: faker.date.future(),
    information: {},
    status: SaleStatusSchema.enum.OPEN,
    toWalletsAddress: faker.finance.ethereumAddress(),
    saleStartDate: new Date(),
    tokenPricePerUnit: new Decimal(
      faker.number.float({
        min: 0.111111111,
        max: 9999.99,
      }),
    ),
    tokenName: faker.finance.currencyName(),
    tokenContractAddress: faker.finance.ethereumAddress(),
    initialTokenQuantity: faker.number.int({ min: 1000, max: 1000000 }),
    documents: {},
    ...data,
  };
};

const mockTokenOnBlockchain = () => {
  const chain = faker.helpers.arrayElement(ALLOWED_CHAINS);
  let tokenListObjs = NETWORK_TO_TOKEN_MAPPING[chain.id];
  if (!tokenListObjs) {
    tokenListObjs = NETWORK_TO_TOKEN_MAPPING[137]; // Polygon as fallback
  }
  const tokenList = Object.values(tokenListObjs!) as {
    symbol: string;
    contract: string;
    enabled: boolean;
    decimals: number;
    isNative: boolean;
  }[];
  const token = faker.helpers.arrayElement(Object.values(tokenList));
  return {
    isNative: token.isNative,
    chainId: faker.helpers.arrayElement(ALLOWED_CHAINS).id,
    tokenSymbol: token.symbol,
    name: faker.word.noun({ length: { min: 3, max: 5 } }),
    decimals: token.decimals,
    token,
    contractAddress: token.contract || faker.finance.ethereumAddress(),
  };
};

export const createMockSaleWithToken = async (
  db: PrismaClient,
  {
    userAddress,
    currency,
    saleData,
  }: {
    userAddress: string;
    currency: string;
    saleData?: Partial<Prisma.SaleCreateInput>;
  },
) => {
  const sale = generateMockSale(saleData);
  const { token, ...tob } = mockTokenOnBlockchain();

  const chain = defineChain(tob.chainId);

  // First we check if the token configuration exists in DB or if is new
  const tobCreated = await db.tokensOnBlockchains.upsert({
    where: {
      tokenSymbol_chainId: {
        tokenSymbol: token.symbol,
        chainId: tob.chainId,
      },
    },
    create: {
      blockchain: {
        connectOrCreate: {
          where: {
            chainId: tob.chainId,
          },
          create: {
            name: chain.name || "Unknown chain",
            rpcUrl: chain.rpc,
            explorerUrl: chain.blockExplorers?.[0]?.url,
            isTestnet: chain.testnet,
            isEnabled: true,
            chainId: chain.id,
          },
        },
      },
      name: tob.name,
      decimals: tob.decimals,
      token: {
        create: {
          symbol: token.symbol,
        },
      },
    },
    update: {},
    select: {
      blockchain: {
        select: {
          id: true,
          chainId: true,
        },
      },
      token: {
        select: {
          id: true,
          symbol: true,
        },
      },
    },
  });

  const saleCreated = await db.sale.create({
    data: {
      ...sale,
      information: {},
      user: {
        connect: {
          walletAddress: userAddress,
        },
      },
      saleCurrency: {
        connectOrCreate: {
          where: {
            symbol: currency,
          },
          create: {
            symbol: currency,
            name: currency,
            type: FIAT_CURRENCIES.includes(currency)
              ? CurrencyTypeSchema.enum.FIAT
              : CurrencyTypeSchema.enum.CRYPTO,
          },
        },
      },
      blockchain: {
        connect: {
          chainId: tob.chainId,
        },
      },
      token: {
        connect: {
          id: tobCreated.token.id,
          symbol: tobCreated.token.symbol,
        },
      },
    } as Prisma.SaleCreateInput,
  });
  return { sale: saleCreated, token: tobCreated };
};

/**
 * Cleanup function to delete test context. It is required to pass which entities to delete to avoid deleting other tests context.
 */
export const cleanUpTestContext = async (
  db: PrismaClient,
  {
    transactions,
    sales,
    users,
  }: {
    transactions?: SaleTransactions[];
    sales?: Sale[];
    users?: User[];
  },
) => {
  console.time("[cleanUpTestContext]");
  if (transactions?.length) {
    const toDelete = transactions.map((tx) => tx?.id).filter(Boolean);
    if (toDelete?.length) {
      await db.saleTransactions.deleteMany({
        where: {
          id: {
            in: toDelete,
          },
        },
      });
    }
  }
  if (sales?.length || transactions?.length) {
    const toDelete = [
      ...(sales?.map((sale) => sale?.id) || []),
      ...(transactions?.map((tx) => tx?.saleId) || []),
    ].filter(Boolean);
    if (toDelete?.length) {
      await db.sale.deleteMany({
        where: {
          id: { in: toDelete },
        },
      });
    }
  }
  if (users && users?.filter((user) => user?.id)?.length) {
    const toDelete = users.map((user) => user?.id).filter(Boolean);
    if (toDelete?.length) {
      await db.user.deleteMany({
        where: {
          id: {
            in: toDelete,
          },
        },
      });
    }
  }
  console.timeEnd("[cleanUpTestContext]");
};

/**
 * Create a test scenario with admin user, user, sale and transaction.
 * Ideal to be used inside test hooks
 */
export const createScenario = async (db: PrismaClient) => {
  const [adminUser, regularUser] = await Promise.all([
    db.user.create({
      data: {
        ...mockUsers(),
        profile: {
          create: mockProfile(),
        },
        userRole: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: "ADMIN" },
                create: { name: "ADMIN" },
              },
            },
          },
        },
      },
    }),
    db.user.create({
      data: {
        ...mockUsers({ email: "test@example.com" }),
        profile: {
          create: mockProfile(),
        },
        emailVerified: true,
      },
    }),
  ]);

  const { sale, transaction, token } = await createMockSaleWithToken(db, {
    userAddress: adminUser.walletAddress,
    currency: "USD",
    saleData: {
      status: SaleStatusSchema.enum.OPEN,
    }
  }).then(async ({ sale, token }) => {
    // biome-ignore lint/correctness/noUnusedVariables: destructured to remove id
    const { id, metadata, ...tx } = mockTransactions({
      blockchainId: token.blockchain.id,
      tokenSymbol: token.token.symbol,
    });

    return {
      token,
      sale,
      transaction: await db.saleTransactions.create({
        data: {
          ...tx,
          saleId: sale.id,
          userId: regularUser.id,
          ...(metadata ? { metadata } : {}),
        },
      }),
    };
  });

  return {
    sale,
    user: regularUser,
    admin: adminUser,
    transaction,
    token,
  };
};
