// import { Alchemy, Network } from "alchemy-sdk";
// import * as chains from "wagmi/chains";
// import logger from "../logger.server";

// const networks = [
// 	{
// 		id: chains.mainnet.id,
// 		name: chains.mainnet.name,
// 		connector: Network.ETH_MAINNET,
// 		apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_ID,
// 	},
// 	{
// 		id: chains.sepolia.id,
// 		name: chains.sepolia.name,
// 		connector: Network.ETH_SEPOLIA,
// 		apiKey: process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_ID,
// 	},
// 	{
// 		id: chains.polygon.id,
// 		name: chains.polygon.name,
// 		connector: Network.MATIC_MAINNET,
// 		apiKey: process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_ID,
// 	},
// 	{
// 		id: chains.polygonMumbai.id,
// 		name: chains.polygonMumbai.name,
// 		connector: Network.MATIC_MUMBAI,
// 		apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_ID,
// 	},
// ];

// type ValidChain = (typeof networks)[number]["id"];

// export const isValidChainId = (data: number | null): data is ValidChain => {
// 	return (
// 		Boolean(data) &&
// 		typeof data === "number" &&
// 		!!networks.find((n) => n.id === data)
// 	);
// };

// class NodeProviderService {
// 	[chains.mainnet.id]: Alchemy | null;
// 	[chains.sepolia.id]: Alchemy | null;
// 	[chains.polygon.id]: Alchemy | null;
// 	[chains.polygonMumbai.id]: Alchemy | null;

// 	constructor() {
// 		networks.forEach((n) => {
// 			this[n.id] = new Alchemy({
// 				apiKey: n.apiKey,
// 				network: n.connector,
// 			});
// 		});
// 	}

// 	async getTransaction(chain: ValidChain, hash: string) {
// 		const client = this[chain];
// 		if (!client) {
// 			logger(
// 				`nodeProvider.getTransaction was called with an unknown chain: ${chain}`,
// 			);
// 			return null;
// 		}
// 		return client?.transact?.getTransaction(hash);
// 	}
// }

// const nodeProvider = new NodeProviderService();

// export default nodeProvider;
