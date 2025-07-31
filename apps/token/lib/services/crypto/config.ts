// import { Currency } from '@prisma/client';
// // import { constants } from 'ethers';
// // import { getAddress } from 'ethers/lib/utils';

import { getAddress, NATIVE_TOKEN_ADDRESS } from 'thirdweb';

import * as c from 'thirdweb/chains';

const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const ALLOWED_CHAINS =
  process.env.NODE_ENV === 'production'
    ? [c.bsc]
    : [c.bscTestnet, c.sepolia, c.baseSepolia];

// // type AcceptedTokens =
// //   (typeof NETWORK_TO_TOKEN_MAPPING)[keyof typeof NETWORK_TO_TOKEN_MAPPING];

// // export type NetworkToken = AcceptedTokens[CryptoCurrency];

// // export function getNetworkToken(
// //   chain?: Chain,
// //   currency?: Currency
// // ): AcceptedTokens[CryptoCurrency] | undefined {
// //   if (!chain || !currency) return;
// //   return NETWORK_TO_TOKEN_MAPPING[chain.id][currency];
// // }

// // export function getNetworkTokenList(chain?: Chain): AcceptedTokens | undefined {
// //   if (!chain) return;
// //   return NETWORK_TO_TOKEN_MAPPING[chain.id];
// // }

const STABLECOIN_DECIMALS = 6;
const ERC20_DECIMALS = 18;
const BTC_DECIMALS = 8;

export const NETWORK_TO_TOKEN_MAPPING = {
  [c.bsc.id]: {
    ['BNB']: {
      symbol: 'BNB',
      contract: getAddress(NATIVE_TOKEN_ADDRESS),
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
    ['USDC']: {
      symbol: 'USDC',
      contract: getAddress('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'),
      enabled: true,
      decimals: STABLECOIN_DECIMALS,
    },
    ['WBTC']: {
      symbol: 'WBTC',
      contract: getAddress('0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'),
      enabled: true,
      decimals: BTC_DECIMALS,
    },
    ['ETH']: {
      symbol: 'ETH',
      contract: getAddress('0x2170Ed0880ac9A755fd29B2688956BD959F933F8'),
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
  },
  [c.base.id]: {
    ['USDC']: {
      symbol: 'USDC',
      contract: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
      enabled: true,
      decimals: STABLECOIN_DECIMALS,
    },
    ['ETH']: {
      symbol: 'ETH',
      contract: NATIVE_ADDRESS,
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
    ['WBTC']: {
      symbol: 'WBTC',
      contract: getAddress('0x8093cF4fB28cF836dc241232a3aCc662637367cE'),
      enabled: true,
      decimals: BTC_DECIMALS,
    },
  },
  [c.sepolia.id]: {
    ['USDC']: {
      symbol: 'USDC',
      contract: getAddress('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
      enabled: true,
      decimals: STABLECOIN_DECIMALS,
    },
    ['ETH']: {
      symbol: 'ETH',
      contract: getAddress('0x4200000000000000000000000000000000000006'),
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
    ['WBTC']: {
      symbol: 'WBTC',
      contract: getAddress('0x8093cF4fB28cF836dc241232a3aCc662637367cE'),
      enabled: true,
      decimals: BTC_DECIMALS,
    },
  },
  [c.baseSepolia.id]: {
    ['USDC']: {
      symbol: 'USDC',
      contract: getAddress('0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
      enabled: true,
      decimals: STABLECOIN_DECIMALS,
    },
    ['ETH']: {
      symbol: 'ETH',
      contract: getAddress('0x4200000000000000000000000000000000000006'),
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
    ['WBTC']: {
      symbol: 'WBTC',
      contract: getAddress('0x8093cF4fB28cF836dc241232a3aCc662637367cE'),
      enabled: true,
      decimals: BTC_DECIMALS,
    },
  },
  [c.bscTestnet.id]: {
    ['BNB']: {
      symbol: 'BNB',
      contract: NATIVE_TOKEN_ADDRESS,
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
    ['USDC']: {
      // Replace to use something similar
      symbol: 'bUSD',
      contract: getAddress('0x48D87A2d14De41E2308A764905B93E05c9377cE1'),
      enabled: true,
      decimals: STABLECOIN_DECIMALS,
    },
    ['tMJS']: {
      symbol: 'tMJS',
      contract: getAddress('0x8699210141B710c46eC211cDD39D2C2edDA7A63c'),
      enabled: true,
      decimals: STABLECOIN_DECIMALS,
    },
    ['ETH']: {
      symbol: 'ETH',
      contract: getAddress('0xb4c1e96e648e763d3eb5cd1bb2ec9c93293de49f'),
      enabled: true,
      decimals: ERC20_DECIMALS,
    },
    // ['WBTC']: {
    //   symbol: 'WBTC',
    //   contract: getAddress('0x556eB94846682858E24778984280B1a16B228c21'),
    //   enabled: true,
    //   decimals: BTC_DECIMALS,
    // },
  },

  // [c.polygon.id]: {
  //   [Currency.USDC]: {
  //     symbol: Currency.USDC,
  //     /**
  //      * Deprecation warning of USDC.e
  //      * @see https://help.circle.com/s/article-page?articleId=ka0Un00000011rLIAQ
  //      */
  //     contract: getAddress('0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'), // USDC native
  //     // contract: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', USDC.e bridged
  //     enabled: IS_PRODUCTION ? true : false,
  //     decimals: STABLECOIN_DECIMALS,
  //   },
  //   [Currency.ETH]: {
  //     symbol: Currency.ETH,
  //     contract: getAddress('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'),
  //     enabled: IS_PRODUCTION ? true : false,
  //     decimals: ERC20_DECIMALS,
  //   },
  //   [Currency.MATIC]: {
  //     symbol: Currency.MATIC,
  //     contract: constants.AddressZero,
  //     enabled: IS_PRODUCTION ? true : false,
  //     decimals: ERC20_DECIMALS,
  //   },
  //   [Currency.LINK]: {
  //     symbol: Currency.LINK,
  //     contract: getAddress('0xb0897686c545045aFc77CF20eC7A532E3120E0F1'),
  //     enabled: false,
  //     decimals: ERC20_DECIMALS,
  //   },
  // },
  // [polygonMumbai.id]: {
  //   [Currency.USDC]: {
  //     symbol: Currency.USDC,
  //     contract: getAddress('0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97'),
  //     enabled: true,
  //     decimals: STABLECOIN_DECIMALS,
  //   },
  //   [Currency.ETH]: {
  //     symbol: Currency.ETH,
  //     contract: getAddress('0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'),
  //     enabled: true,
  //     decimals: ERC20_DECIMALS,
  //   },
  //   [Currency.MATIC]: {
  //     symbol: Currency.MATIC,
  //     contract: constants.AddressZero,
  //     enabled: true,
  //     decimals: ERC20_DECIMALS,
  //   },
  //   [Currency.LINK]: {
  //     symbol: Currency.LINK,
  //     contract: getAddress('0x326c977e6efc84e512bb9c30f76e30c160ed06fb'),
  //     enabled: true,
  //     decimals: ERC20_DECIMALS,
  //   },
  // },
};
