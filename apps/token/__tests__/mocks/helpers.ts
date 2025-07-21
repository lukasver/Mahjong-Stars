import { GetExchangeRate } from '@/common/schemas/dtos/rates';

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
