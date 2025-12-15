"use client";

import { InstaxchangeWidget } from "@/components/buy/widgets/instaxchange";
import { useTransactionById } from "@/lib/services/api";

// function getSupportedTokens(chainId: number | undefined) {
//   if (!chainId) return [];
//   return Object.values(NETWORK_TO_TOKEN_MAPPING[chainId] || {}).map((t) => ({
//     name: t.symbol,
//     address: t.contract,
//     symbol: t.symbol,
//     isNative: t.isNative,
//     decimals: t.decimals,
//   }));
// }

// const TEST_WALLET = "0x65Dc6524318b31dF425c57C02e2A1630FA330c24";

// const AMOUNT = "0.0001";

export const TestClientComponent = () => {
  // const { activeAccount, chainId } = useActiveAccount();
  // const activeWallet = useActiveWallet();
  // const { data, isLoading, error } = useBlockchains(!!activeAccount);
  const txId = "cmj33zu7500018o2as7lacqb7";
  const {
    data: txData,
    isLoading: txLoading,
  } = useTransactionById(txId);

  // const chain = data?.chains?.find((chain) => {
  //   return chain.chainId === chainId;
  // });

  // const supportedTokens = getSupportedTokens(chain?.chainId);

  // const paymentToken = supportedTokens.find((token) => token.isNative);

  // const handleTransaction = (chainId: number) => {
  //   const chain = {
  //     chainId: chainId,
  //     isNative: paymentToken?.isNative || false,
  //     decimals: paymentToken?.decimals || 18,
  //     contractAddress: paymentToken?.address || NATIVE_TOKEN_ADDRESS,
  //   };

  //   const contract = getContract({
  //     client: client,
  //     chain: defineChain(chainId),
  //     address: chain.contractAddress!,
  //   });

  //   const formattedAmount = toUnits(AMOUNT, chain.decimals);

  //   // Native token
  //   if (chain.isNative || chain.contractAddress === NATIVE_TOKEN_ADDRESS) {
  //     return prepareTransaction({
  //       chain: defineChain(chain.chainId),
  //       client: client,
  //       value: formattedAmount,
  //       to: TEST_WALLET,
  //     });
  //   }
  //   // ERC-20
  //   if (chain.decimals) {
  //     console.log("ENTRANDO A ERC20", contract, AMOUNT);
  //     const txs = transfer({
  //       contract,
  //       amount: AMOUNT,
  //       to: TEST_WALLET,
  //     });

  //     return txs;
  //     // Native BTC for example? :think
  //   } else {
  //     throw new Error("NOT IMPLEMENTED");
  //     // const txs = prepareContractCall({
  //     //   contract,
  //     //   method: resolveMethod("transfer"),
  //     //   params: [activeAccount?.address!, toWallet, formattedAmount],
  //     // });
  //     // return txs;
  //   }
  // };

  if (txLoading || !txData) {
    return <div>Loading...</div>;
  }

  // if (error || txError) {
  //   return <div>Error: {JSON.stringify(error)}</div>;
  // }

  const tx = txData?.transaction;
  if (!tx) {
    return <div>Transaction not found</div>;
  }

  return (
    <InstaxchangeWidget
      transaction={tx}
      onSuccess={() => {
        console.log("success");
      }}
      onError={(error) => {
        console.error(error);
      }}
    />
  );

  // return (
  //   <div className="h-screen w-screen grid place-items-center">
  //     <div className="max-w-4xl w-full flex flex-col gap-8 justify-center">
  //       <TransactionWidget
  //         client={client}
  //         currency={"USD"}
  //         // chain={defineChain(42161)}
  //         amount={AMOUNT}
  //         transaction={handleTransaction(chainId)}
  //         activeWallet={activeWallet}
  //         connectOptions={{
  //           autoConnect: true,
  //         }}
  //         image="https://storage.googleapis.com/mjs-public/branding/banner.webp"
  //         paymentMethods={["crypto", "card"]}
  //         title="Purchase"
  //         buttonLabel="Proceed"

  //       // transaction={claimTo({
  //       //   contract: nftContract,
  //       //   quantity: 1n,
  //       //   to: account?.address || "",
  //       //   tokenId: 2n,
  //       // })}
  //       />

  //       {/* <ConnectionTest /> */}
  //       {/* <OnRampWidget
  //     transaction={tx?.transaction}
  //     onSuccessPayment={() => {
  //       //
  //     }}
  //   /> */}
  //     </div>
  //   </div>
  // );
};
