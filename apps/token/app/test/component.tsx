"use client";

import { useSearchParams } from "next/navigation";
import { InstaxchangeWidget } from "@/components/buy/widgets/instaxchange";

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
  const searchParams = useSearchParams();
  const tx = searchParams.get("tx");

  if (!tx) {
    return <div>No transaction found</div>;
  }

  return (
    <div className="h-screen w-screen grid place-items-center">
      <div className="max-w-4xl w-full">
        <InstaxchangeWidget
          txId={tx}
          onSuccess={(d) => {
            console.log("success---", d);
          }}
          onError={(error) => {
            console.error("ERROR---", error);
          }}
        />
      </div>
    </div>
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
