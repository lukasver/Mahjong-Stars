"use client";
import { invariant } from "@epic-web/invariant";
import { StaggeredRevealAnimation } from "@mjs/ui/components/motion";
import { usePrevious } from "@mjs/ui/hooks";
import { Button } from "@mjs/ui/primitives/button";
import { toast } from "@mjs/ui/primitives/sonner";
import { FOP } from "@prisma/client";
import Decimal from "decimal.js";
import { useAction } from "next-safe-action/hooks";
import { SupportedFiatCurrency } from "node_modules/thirdweb/dist/types/pay/convert/type";
import { WaitForReceiptOptions } from "node_modules/thirdweb/dist/types/transaction/actions/wait-for-tx-receipt";
import { useCallback, useEffect, useState } from "react";
import {
  defineChain,
  getContract,
  NATIVE_TOKEN_ADDRESS,
  prepareTransaction,
  toUnits,
} from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionWidget, useActiveWallet } from "thirdweb/react";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { FOPSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import useActiveAccount from "@/components/hooks/use-active-account";
import { buyPrepare } from "@/lib/actions";
import { client } from "@/lib/auth/thirdweb-client";
import { useBlockchains } from "@/lib/services/api";
import {
  AppTokenInfo,
  NETWORK_TO_TOKEN_MAPPING,
} from "@/lib/services/crypto/config";
import calculator from "@/lib/services/pricefeeds";
import { OnRampSkeleton } from "./skeletons";
import { WithErrorHandler } from "./utils";


const isFiatCurrency = (currency: string) => {
  return FIAT_CURRENCIES.includes(currency);
};

export type SuccessCryptoPaymentData = {
  transactionHash: string;
  chainId: number;
  amountPaid: string;
  paidCurrency: string;
  formOfPayment: FOP;
  paymentDate: Date;
};

type CryptoTransactionWidgetComponentProps = {
  transaction: TransactionByIdWithRelations;
  onSuccessPayment: ({
    transactionHash,
    chainId,
  }: SuccessCryptoPaymentData) => void;
};

const CryptoTransactionWidgetComponent = ({
  transaction: tx,
  onSuccessPayment,
}: CryptoTransactionWidgetComponentProps) => {
  const [mounted, toggleMount] = useState(true);
  const [amount, setAmount] = useState<{
    amount: string | null;
    currency: string | null;
    quantity: string | null;
    gasCost: string | null;
  }>({
    amount: null,
    currency: null,
    quantity: tx.quantity.toString() || null,
    gasCost: null,
  });
  const [blockError, setBlockError] = useState<string | null>(null);
  const { activeAccount, chainId } = useActiveAccount();
  const prevChainId = usePrevious(chainId);

  const activeWallet = useActiveWallet();

  const { data, isLoading, error } = useBlockchains(!!activeAccount);

  const chain = data?.chains?.find((chain) => {
    return chain.chainId === chainId;
  });

  const { tokens: supportedTokens, isSupported } = getSupportedTokens(
    chain?.chainId,
  );

  // If user is paying in FIAT, we default to native currency of connected chain.
  const paymentToken = supportedTokens.find((token) =>
    isFiatCurrency(tx.totalAmountCurrency)
      ? token.isNative || token.address === NATIVE_TOKEN_ADDRESS
      : token.symbol === tx.totalAmountCurrency,
  );

  const receiverAddress = tx.sale.toWalletsAddress;


  useEffect(() => {
    // Refetch prices if user changes chain (which will change the payment token)
    const shouldFetch = prevChainId && chainId && prevChainId !== chainId;
    if ((!isLoading && !amount?.amount && chain) || shouldFetch) {
      async function getEquivalentAmountInCrypto() {
        const newPaidCurrency = paymentToken?.symbol;
        invariant(newPaidCurrency, "New paid currency couldn't be derived");
        // We should not add fee here but probably add an extra for the gas??
        const result = await calculator.convertCurrency({
          amount: tx.totalAmount.toString(),
          fromCurrency: tx.paidCurrency,
          toCurrency: newPaidCurrency!,
          precision: 18,
        });

        setAmount((p) => ({
          ...p,
          amount: new Decimal(result.amount).toSignificantDigits().toString(),
          currency: result.currency,
          pricePerUnit: new Decimal(result.pricePerUnit)
            .toSignificantDigits()
            .toString(),
        }));
      }
      getEquivalentAmountInCrypto().catch((error) => {
        setBlockError(
          error instanceof Error
            ? error.message
            : "An error occurred while converting currency amount",
        );
      });
    }
  }, [
    isLoading,
    chain,
    paymentToken?.symbol,
    tx.totalAmount,
    tx.paidCurrency,
    tx,
    amount.amount,
  ]);

  const totalAmountToPay = new Decimal(amount.amount || 0)
    .plus(amount.gasCost || "0")
    .toString();

  const pv = usePrevious(totalAmountToPay);

  useEffect(() => {
    if (totalAmountToPay !== pv) {
      // Hack to make to widget update the value if gas fees changes, otherwise the widget only update once
      toggleMount((pv) => !pv);
      setTimeout(() => {
        toggleMount((pv) => !pv);
      }, 1);
    }
  }, [totalAmountToPay, pv]);

  const handleTransaction = useCallback(
    (chainId: number, amount: string) => {

      /**
       * If user is paying an a crypto / chain combination Fortris doesn't support.
       * we need to look for the quote to convert to a coin we accept and do some safe check there. (maybe outside here)
       */

      const chain = {
        chainId: chainId,
        isNative: paymentToken?.isNative || false,
        decimals: paymentToken?.decimals || 18,
        contractAddress: paymentToken?.address || NATIVE_TOKEN_ADDRESS,
      };

      console.log("🚀 ~ transaction.tsx:152 ~ chain:", chain);

      const contract = getContract({
        client: client,
        chain: defineChain(chainId),
        address: chain.contractAddress!,
      });

      const formattedAmount = toUnits(amount, chain.decimals);

      console.log(
        "🚀 ~ transaction.tsx:167 ~ formattedAmount:",
        formattedAmount,
      );

      // Native token
      if (chain.isNative || chain.contractAddress === NATIVE_TOKEN_ADDRESS) {
        return prepareTransaction({
          chain: defineChain(chain.chainId),
          client: client,
          value: formattedAmount,
          to: receiverAddress,
        });
      }
      // ERC-20
      if (chain.decimals) {

        const txs = transfer({
          contract,
          amount: amount,
          to: receiverAddress,
        });

        return txs;
        // Native BTC for example? :think
      } else {
        throw new Error("NOT IMPLEMENTED");

      }
    },
    [chainId, totalAmountToPay],
  );

  const title = `Purchasing: ${tx.quantity} ${tx.tokenSymbol}`;

  const handleSuccessPayment = (data: WaitForReceiptOptions) => {
    onSuccessPayment({
      transactionHash: data.transactionHash,
      chainId: data.chain.id,
      amountPaid: totalAmountToPay,
      paidCurrency: paymentToken?.symbol || tx.paidCurrency,
      formOfPayment: FOPSchema.enum.CRYPTO,
      paymentDate: new Date(),
    });
  };

  const action = useAction(buyPrepare);

  const handleCheckQuote = async () => {
    const originTokenAddress = NATIVE_TOKEN_ADDRESS;
    console.debug("originTokenAddress", originTokenAddress);
    try {
      invariant(chainId, "Chain ID is required");
      invariant(paymentToken?.address, "Payment token address is required");
      invariant(originTokenAddress, "Token address is required");
      invariant(activeAccount?.address, "Account address is required");

      const res = await action.executeAsync({
        // Total amount to pay in the destination
        amount: totalAmountToPay,
        chainId: chainId,
        originTokenAddress: originTokenAddress || "",
        sender: activeAccount?.address || "",
      });

      console.debug("🚀 ~ transaction.tsx:225 ~ res:", res);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "An error occurred while checking the quote",
      );
    }
  };

  if (blockError) {
    throw new Error(blockError);
  }
  if (error) {
    return <div>Error</div>;
  }

  if (!chain || !data?.chains?.length) {
    throw new Error("Chain not supported or not found");
  }

  if (isLoading || !amount.amount || totalAmountToPay === "0") {
    return <OnRampSkeleton />;
  }

  if (!chainId) {
    return null;
  }

  return (
    <StaggeredRevealAnimation isVisible={mounted}>
      <div className="w-full flex flex-col gap-4 justify-center items-center">
        <TransactionWidget
          client={client}
          currency={
            ((isFiatCurrency(tx.totalAmountCurrency)
              ? tx.totalAmountCurrency
              : tx.sale.currency) as SupportedFiatCurrency) || "USD"
          }
          // chain={defineChain(42161)}
          amount={totalAmountToPay || "1"}
          transaction={handleTransaction(chainId, totalAmountToPay)}
          activeWallet={activeWallet}
          connectOptions={{
            autoConnect: true,
          }}
          image="https://storage.googleapis.com/mjs-public/branding/banner.webp"
          paymentMethods={["crypto", "card"]}
          title={title}
          buttonLabel="Proceed with payment"
          purchaseData={{
            transactionId: tx.id,
          }}
          supportedTokens={{
            // Only native token for testing
            [chain.chainId]: supportedTokens.filter(
              (token) => token.symbol === paymentToken?.symbol,
            ),
          }}
          onSuccess={handleSuccessPayment}
          onCancel={() => {
            toast.error("Purchase cancelled by user");
          }}
          onError={(error) => {
            toast.error(error.message);
          }}
        />
        <p>{isSupported ? "Supported" : "Not supported"}</p>
        <p>Payment currency: {tx.totalAmountCurrency}</p>
        <p>token to purchase: {paymentToken?.symbol}</p>
        <Button onClick={handleCheckQuote}>Check quote</Button>
      </div>
    </StaggeredRevealAnimation>
  );
};

export const CryptoTransactionWidget = WithErrorHandler(
  CryptoTransactionWidgetComponent,
);

function getSupportedTokens(chainId: number | undefined): {
  isSupported: boolean;
  tokens: AppTokenInfo[];
} {
  if (!chainId) return { isSupported: false, tokens: [] };
  const tokens = Object.values(NETWORK_TO_TOKEN_MAPPING[chainId] || {}).map(
    (t) => ({
      name: t.symbol,
      address: t.contract,
      symbol: t.symbol,
      isNative: t.isNative,
      decimals: t.decimals,
    }),
  );

  // Mock that native tokens are supported
  const isSupported = tokens.some((token) => token.isNative);

  return { isSupported, tokens };
}
