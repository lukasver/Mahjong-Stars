import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from '@/common/config/constants';
import { GetExchangeRate } from '@/common/schemas/dtos/rates';
import { InformationSchemaAsStrings } from '@/common/schemas/dtos/sales/information';
import {
  FOPSchema,
  Sale,
  SaleStatusSchema,
  SaleTransactions,
  User,
} from '@/common/schemas/generated';
import { faker } from '@faker-js/faker';
import { TransactionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
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

export const mockUsers = (data?: Partial<User>): User => {
  const wallet = faker.finance.ethereumAddress();
  const fullname = faker.person.fullName();
  const firstName = fullname.split(' ')[0];
  const lastName = fullname.split(' ')[1];
  const email = faker.internet.email();

  return {
    id: faker.string.nanoid(25),
    email: email,
    emailVerified: true,
    name: fullname,
    profile: {
      id: faker.string.nanoid(25),
      firstName: firstName,
      lastName: lastName,
    },
    walletAddress: wallet,
    isSiwe: true,
    ...data,
  } as User;
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

// export const generateMockFormEntry = (
//   tx?: Partial<FormInvestSchema>,
//   type: 'BOTH' | 'CRYPTO' | 'FIAT' = 'BOTH'
// ) => {
//   const currency = faker.helpers.arrayElement(
//     type === 'BOTH'
//       ? ACCEPTED_CURRENCIES
//       : type === 'CRYPTO'
//       ? CRYPTO_CURRENCIES
//       : FIAT_CURRENCIES
//   );
//   const decimals = faker.helpers.arrayElement([...Array(19).keys()]);
//   const float = `${faker.number.float({
//     min: 0.1,
//     max: 99999999,
//     fractionDigits: decimals,
//   })}`;
//   const cryptoAmountInString = parseUnits(float, decimals);
//   if (cryptoAmountInString.toString()) {
//     //TODO CHECk, this ensures that the number has the correct amount of decimals but keeps the integers.
//   }

//   return {
//     formOfPayment: FOP.CARD,
//     quantity: faker.string.numeric({
//       length: { min: 1, max: 7 },
//       exclude: ['0'],
//     }),
//     address: faker.finance.ethereumAddress(),
//     paymentAmount: faker.finance.amount({
//       min: 0.111111111,
//       max: 9999999.999929121,
//     }),
//     paymentCurrency: currency,
//     paymentAmountCrypto:
//       type !== 'FIAT' && CRYPTO_CURRENCIES.includes(currency as any)
//         ? cryptoAmountInString
//         : '',
//     ...tx,
//   } as FormInvestSchema;
// };

export const generateMockSale = (data?: Partial<Sale>): Sale => {
  return {
    availableTokenQuantity: faker.number.int({ min: 10000, max: 99999 }),
    coverPicture: faker.image.urlPicsumPhotos(),
    createdAt: faker.date.past(),
    createdBy: faker.string.numeric(18),
    maximumTokenBuyPerUser: undefined,
    minimumTokenBuyPerUser: 1,
    name: faker.lorem.words(3),
    saftCheckbox: faker.datatype.boolean(),
    kycRequired: faker.datatype.boolean(),
    saleClosingDate: faker.date.future(),
    saleInformation: InformationSchemaAsStrings.shape.information.parse(
      Array(faker.number.int({ min: 1, max: 10 }))
        .fill(null)
        .map(() => ({
          value: faker.lorem.words(3),
          label: faker.lorem.words(3),
          type: faker.helpers.arrayElement(['text', 'textarea']),
        }))
    ),
    status: SaleStatusSchema.enum.OPEN,
    toWalletsAddress: faker.finance.ethereumAddress(),
    saleStartDate: Date.now(),
    tokenSymbol: faker.helpers.arrayElement(CRYPTO_CURRENCIES),
    saleCurrency: faker.helpers.arrayElement(FIAT_CURRENCIES),
    tokenPricePerUnit: new Decimal(
      faker.number.float({
        min: 0.111111111,
        max: 9999.99,
      })
    ),
    ...data,
  } as Sale;
};
