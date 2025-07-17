// import { Currency } from '@prisma/client';
// // import { constants } from 'ethers';
// // import { getAddress } from 'ethers/lib/utils';

import * as c from 'thirdweb/chains';

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

// // export const NETWORK_TO_TOKEN_MAPPING = {
// //   [mainnet.id]: {
// //     [Currency.USDC]: {
// //       symbol: Currency.USDC,
// //       contract: getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
// //       enabled: IS_PRODUCTION ? true : true,
// //       decimals: STABLECOIN_DECIMALS,
// //     },
// //     [Currency.ETH]: {
// //       symbol: Currency.ETH,
// //       contract: constants.AddressZero,
// //       enabled: IS_PRODUCTION ? true : true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.MATIC]: {
// //       symbol: Currency.MATIC,
// //       contract: getAddress('0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'),
// //       enabled: IS_PRODUCTION ? true : false,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.LINK]: {
// //       symbol: Currency.LINK,
// //       contract: getAddress('0x514910771AF9Ca656af840dff83E8264EcF986CA'),
// //       enabled: IS_PRODUCTION ? true : false,
// //       decimals: ERC20_DECIMALS,
// //     },
// //   },
// //   [sepolia.id]: {
// //     [Currency.USDC]: {
// //       symbol: Currency.USDC,
// //       contract: getAddress('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
// //       enabled: true,
// //       decimals: STABLECOIN_DECIMALS,
// //     },
// //     [Currency.ETH]: {
// //       symbol: Currency.ETH,
// //       contract: constants.AddressZero,
// //       enabled: true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.MATIC]: {
// //       symbol: Currency.MATIC,
// //       contract: getAddress('0x8093cF4fB28cF836dc241232a3aCc662637367cE'),
// //       enabled: true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.LINK]: {
// //       symbol: Currency.LINK,
// //       contract: getAddress('0x779877A7B0D9E8603169DdbD7836e478b4624789'),
// //       enabled: true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //   },

// //   [polygon.id]: {
// //     [Currency.USDC]: {
// //       symbol: Currency.USDC,
// //       /**
// //        * Deprecation warning of USDC.e
// //        * @see https://help.circle.com/s/article-page?articleId=ka0Un00000011rLIAQ
// //        */
// //       contract: getAddress('0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'), // USDC native
// //       // contract: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', USDC.e bridged
// //       enabled: IS_PRODUCTION ? true : false,
// //       decimals: STABLECOIN_DECIMALS,
// //     },
// //     [Currency.ETH]: {
// //       symbol: Currency.ETH,
// //       contract: getAddress('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'),
// //       enabled: IS_PRODUCTION ? true : false,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.MATIC]: {
// //       symbol: Currency.MATIC,
// //       contract: constants.AddressZero,
// //       enabled: IS_PRODUCTION ? true : false,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.LINK]: {
// //       symbol: Currency.LINK,
// //       contract: getAddress('0xb0897686c545045aFc77CF20eC7A532E3120E0F1'),
// //       enabled: false,
// //       decimals: ERC20_DECIMALS,
// //     },
// //   },
// //   [polygonMumbai.id]: {
// //     [Currency.USDC]: {
// //       symbol: Currency.USDC,
// //       contract: getAddress('0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97'),
// //       enabled: true,
// //       decimals: STABLECOIN_DECIMALS,
// //     },
// //     [Currency.ETH]: {
// //       symbol: Currency.ETH,
// //       contract: getAddress('0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'),
// //       enabled: true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.MATIC]: {
// //       symbol: Currency.MATIC,
// //       contract: constants.AddressZero,
// //       enabled: true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //     [Currency.LINK]: {
// //       symbol: Currency.LINK,
// //       contract: getAddress('0x326c977e6efc84e512bb9c30f76e30c160ed06fb'),
// //       enabled: true,
// //       decimals: ERC20_DECIMALS,
// //     },
// //   },
// // };
