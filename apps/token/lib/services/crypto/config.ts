// import { Currency } from '@prisma/client';
// // import { constants } from 'ethers';
// // import { getAddress } from 'ethers/lib/utils';

import { getAddress, NATIVE_TOKEN_ADDRESS } from "thirdweb";

import * as c from "thirdweb/chains";

export const ALLOWED_CHAINS =
	process.env.NODE_ENV === "production"
		? [c.bsc, c.base, c.optimism, c.arbitrum, c.ethereum]
		: [c.bscTestnet, c.sepolia, c.baseSepolia, c.base, c.bsc, c.optimism, c.arbitrum,c.ethereum];

const STABLECOIN_DECIMALS = 6;
const ERC20_DECIMALS = 18;
const BTC_DECIMALS = 8;

export const NETWORK_TO_TOKEN_MAPPING = {
	[c.bsc.id]: {
		["BNB"]: {
			symbol: "BNB",
			contract: getAddress(NATIVE_TOKEN_ADDRESS),
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["WBTC"]: {
			symbol: "WBTC",
			contract: getAddress("0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"),
			enabled: true,
			decimals: BTC_DECIMALS,
			isNative: false,
		},
		["ETH"]: {
			symbol: "ETH",
			contract: getAddress("0x2170Ed0880ac9A755fd29B2688956BD959F933F8"),
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: false,
		},
	},
	[c.base.id]: {
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["ETH"]: {
			symbol: "ETH",
			contract: NATIVE_TOKEN_ADDRESS,
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		["WBTC"]: {
			symbol: "WBTC",
			contract: getAddress("0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"),
			enabled: true,
			decimals: BTC_DECIMALS,
			isNative: false,
		},
	},
	[c.sepolia.id]: {
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["ETH"]: {
			symbol: "ETH",
			contract: getAddress("0x4200000000000000000000000000000000000006"),
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		// ['WBTC']: {
		//   symbol: 'WBTC',
		//   contract: getAddress('0x29f2D40B0605204364af54EC677bD022dA425d03'),
		//   enabled: true,
		//   decimals: BTC_DECIMALS,
		// },
	},
	[c.baseSepolia.id]: {
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["ETH"]: {
			symbol: "ETH",
			contract: getAddress("0x4200000000000000000000000000000000000006"),
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		// ['WBTC']: {
		//   symbol: 'WBTC',
		//   contract: getAddress('0x8093cF4fB28cF836dc241232a3aCc662637367cE'),
		//   enabled: true,
		//   decimals: BTC_DECIMALS,
		// },
	},
	[c.bscTestnet.id]: {
		["tBNB"]: {
			symbol: "tBNB",
			contract: NATIVE_TOKEN_ADDRESS,
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		["USDC"]: {
			// Replace to use something similar
			symbol: "bUSD",
			contract: getAddress("0x48D87A2d14De41E2308A764905B93E05c9377cE1"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["tMJS"]: {
			symbol: "tMJS",
			contract: getAddress("0x8699210141B710c46eC211cDD39D2C2edDA7A63c"),
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: false,
		},
		["ETH"]: {
			symbol: "ETH",
			contract: getAddress("0xb4c1e96e648e763d3eb5cd1bb2ec9c93293de49f"),
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: false,
		},
		// ['WBTC']: {
		//   symbol: 'WBTC',
		//   contract: getAddress('0x556eB94846682858E24778984280B1a16B228c21'),
		//   enabled: true,
		//   decimals: BTC_DECIMALS,
		// },
	},
	[c.optimism.id]: {
		["ETH"]: {
			symbol: "ETH",
			contract: NATIVE_TOKEN_ADDRESS,
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["WBTC"]: {
			symbol: "WBTC",
			contract: getAddress("0x68f180fcCe6836688e9084f035309E29Bf0A2095"),
			enabled: true,
			decimals: BTC_DECIMALS,
			isNative: false,
		},
	},
	[c.arbitrum.id]: {
		["ETH"]: {
			symbol: "ETH",
			contract: NATIVE_TOKEN_ADDRESS,
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["WBTC"]: {
			symbol: "WBTC",
			contract: getAddress("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"),
			enabled: true,
			decimals: BTC_DECIMALS,
			isNative: false,
		},
	},
	[c.ethereum.id]: {
		["ETH"]: {
			symbol: "ETH",
			contract: NATIVE_TOKEN_ADDRESS,
			enabled: true,
			decimals: ERC20_DECIMALS,
			isNative: true,
		},
		["USDC"]: {
			symbol: "USDC",
			contract: getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["USDT"]: {
			symbol: "USDC",
			contract: getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
			enabled: true,
			decimals: STABLECOIN_DECIMALS,
			isNative: false,
		},
		["WBTC"]: {
			symbol: "WBTC",
			contract: getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
			enabled: true,
			decimals: BTC_DECIMALS,
			isNative: false,
		},
		}
}
