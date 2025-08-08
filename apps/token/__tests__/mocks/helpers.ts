import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from '@/common/config/constants';
import { GetExchangeRate } from '@/common/schemas/dtos/rates';
import {
  CurrencyTypeSchema,
  FOPSchema,
  SaleStatusSchema,
  SaleTransactions,
  User,
} from '@/common/schemas/generated';
import {
  ALLOWED_CHAINS,
  NETWORK_TO_TOKEN_MAPPING,
} from '@/lib/services/crypto/config';
import { faker } from '@faker-js/faker';
import { PrismaClient, Profile, TransactionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { defineChain } from 'thirdweb';
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

export const mockTransactions = (data?: Partial<SaleTransactions>) => {
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
    })
  );

  const decimals = isCrypto ? 8 : 4;
  return {
    id: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    deletedAt: null,
    tokenSymbol: faker.word.noun({ length: { min: 3, max: 5 } }),
    formOfPayment: isCrypto ? FOPSchema.enum.CRYPTO : FOPSchema.enum.TRANSFER,
    receivingWallet: faker.finance.ethereumAddress(),
    status,
    userId: faker.database.mongodbObjectId(),
    saleId: faker.database.mongodbObjectId(),
    comment: faker.datatype.boolean() ? faker.lorem.lines(1) : null,
    quantity: q,
    amountPaid: paid.toFixed(decimals),
    rawPrice: paid.div(q).toFixed(decimals),
    price: paid.div(q),
    paidCurrency: currency,
    approvedBy: null,
    txHash: isCrypto ? faker.finance.ethereumAddress() : null,
    agreementId: faker.string.nanoid(25),
    blockchainId: null,
    totalAmount: paid,
    rejectionReason: null,
    paymentDate: null,
    paymentEvidenceId: null,
    ...data,
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
    'id' | 'email' | 'emailVerified' | 'name' | 'walletAddress' | 'isSiwe'
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
    'firstName' | 'lastName' | 'phoneNumber' | 'dateOfBirth'
  >;
};

export const mockContract = (
  data?: Partial<{ isSign: boolean; urlSign: null | string }>,
  probability = 0.5
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
      })
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
  const tokenListObjs = NETWORK_TO_TOKEN_MAPPING[chain.id];
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
  }
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
            name: chain.name || 'Unknown chain',
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
