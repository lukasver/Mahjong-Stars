"use client";

import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
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
  const [txId, setTxId] = useState("");
  const [debouncedTxId] = useDebounceValue(txId, 500);
  const handleTxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTxId(e.target.value);
  };
  // const { activeAccount, chainId } = useActiveAccount();
  // const activeWallet = useActiveWallet();
  // const { data, isLoading, error } = useBlockchains(!!activeAccount);
  const { data: txData, isLoading: txLoading } = useTransactionById(
    debouncedTxId || "",
  );
  console.log("🚀 ~ component.tsx:36 ~ txData:", txData);

  const tx = txData?.transaction;

  // const { sessionUrl, isLoading, error, status } = useInstaxchangeSession({
  //   transactionId: tx?.id,
  //   totalAmount: tx?.totalAmount,
  //   paidCurrency: tx?.paidCurrency,
  //   onError: (e) => {
  //     console.error("ERROR ON CREATE SESSION---", e);
  //   },
  // });

  // console.debug("--==--", { sessionUrl, isLoading, error, status });

  const isLoading = txLoading || !txData;



  return (
    <div className="h-screen w-screen grid place-items-center">
      <input type="text" value={txId} onChange={handleTxIdChange} />
      {isLoading || !tx ? <div>Loading...</div> :
        <div className='max-w-4xl w-full'>
          <InstaxchangeWidget
            txId={tx?.id}
            onSuccess={(d) => {
              console.log("success---", d);
            }}
            onError={(error) => {
              console.error("ERROR---", error);
            }}
          />
        </div>
      }
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
