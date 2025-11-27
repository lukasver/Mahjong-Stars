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
import {
  BridgePrepareResult,
  CheckoutWidget,
  CompletedStatusResult,
  TransactionWidget,
  useActiveWallet,
} from "thirdweb/react";
import {
  FIAT_CURRENCIES,
  STABLECOIN_DECIMALS,
} from "@/common/config/constants";
import { env } from "@/common/config/env";
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
import { logWithBigInt, WithErrorHandler } from "./utils";

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
  metadata?: Record<string, unknown>;
};

type CryptoTransactionWidgetComponentProps = {
  transaction: TransactionByIdWithRelations;
  onSuccessPayment: ({
    transactionHash,
    chainId,
  }: SuccessCryptoPaymentData) => void;
  variant?: "checkout" | "transaction";
  acceptStablecoins?: boolean;
  acceptNativeTokens?: boolean;
};

const CryptoTransactionWidgetComponent = ({
  transaction: tx,
  onSuccessPayment,
  acceptStablecoins = true,
  acceptNativeTokens = true,
  ...props
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
    {
      acceptStablecoins,
      acceptNativeTokens,
    },
  );

  console.log("🚀 ~ transaction.tsx:106 ~ upportedTokens, isSupported:", supportedTokens, isSupported);
  console.log("🚀 ~ transaction.tsx:106 ~ acceptStablecoins:", acceptStablecoins);
  console.log("🚀 ~ transaction.tsx:106 ~ acceptNativeTokens:", acceptNativeTokens);
  // If user is paying in FIAT, we default to native currency of connected chain.
  const paymentToken = supportedTokens.find((token) =>
    isFiatCurrency(tx.totalAmountCurrency)
      ? (acceptNativeTokens &&
        (token.isNative || token.address === NATIVE_TOKEN_ADDRESS)) ||
      (acceptStablecoins && token.decimals === STABLECOIN_DECIMALS)
      : // Else, find the crypto token that matches the paid currency
      token.symbol === tx.totalAmountCurrency,
  );


  const receiverAddress = tx.sale.toWalletsAddress;

  useEffect(() => {
    if (props.variant === "checkout") {
      return;
    }
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
          amount: new Decimal(result.amount).toDecimalPlaces().toString(),
          currency: result.currency,
          pricePerUnit: new Decimal(result.pricePerUnit)
            .toDecimalPlaces()
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

      const contract = getContract({
        client: client,
        chain: defineChain(chainId),
        address: chain.contractAddress!,
      });

      const formattedAmount = toUnits(amount, chain.decimals);

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

  // Overloads to ensure type safety based on `variant`

  type HandleSuccessPaymentPayload =
    | {
      variant: "checkout";
      data: { quote: BridgePrepareResult; statuses: CompletedStatusResult[] };
    }
    | {
      variant: "transaction";
      data: WaitForReceiptOptions;
    };

  function handleSuccessPayment(payload: HandleSuccessPaymentPayload) {
    logWithBigInt("handleSuccessPayment", payload);
    if (payload.variant === "checkout") {
      // Get the receipt for the last transaction to use as txhash
      // Loop through all statuses to get the latest transaction
      const transactions = payload.data.statuses.flatMap(status => status.transactions || []);
      const receipt = transactions.at(-1);

      if (!receipt || !receipt.transactionHash) {
        toast.error("No blockchain transactino found", {
          description: "Please try again or reach support if your payment got through",
        });
        return;
      }

      onSuccessPayment({
        transactionHash: receipt?.transactionHash || "",
        chainId: receipt?.chainId || chainId!,
        amountPaid: totalAmountToPay,
        paidCurrency: paymentToken?.symbol || tx.paidCurrency,
        formOfPayment: FOPSchema.enum.CRYPTO,
        paymentDate: new Date(),
        metadata: {
          purchaseData: payload.data.statuses.map((status) => status.purchaseData).flat().filter(Boolean),
          transactions: payload.data.statuses.map((status) => ({
            type: status.type,
            status: status.status,
            // @ts-expect-error - if available
            ...(status.sender && { sender: status.sender }),
            // @ts-expect-error - if available
            ...(status.receiver && { receiver: status.receiver }),
            // @ts-expect-error - if available
            ...(status.paymentId && { paymentId: status.paymentId }),
            transactions: status.transactions
          }))
        },
      });
    }

    if (payload.variant === "transaction") {
      const receipt = payload.data;
      onSuccessPayment({
        transactionHash: receipt.transactionHash,
        chainId: receipt.chain.id,
        amountPaid: totalAmountToPay,
        paidCurrency: paymentToken?.symbol || tx.paidCurrency,
        formOfPayment: FOPSchema.enum.CRYPTO,
        paymentDate: new Date(),
      });
    }
  }

  const action = useAction(buyPrepare);

  const handleCheckQuote = async () => {
    const originTokenAddress = NATIVE_TOKEN_ADDRESS;
    console.debug("originTokenAddress", originTokenAddress);
    try {
      invariant(chainId, "Chain ID is required");
      invariant(paymentToken?.address, "Payment token address is required");
      invariant(originTokenAddress, "Token address is required");
      invariant(activeAccount?.address, "Account address is required");

      await action.executeAsync({
        // Total amount to pay in the destination
        amount: totalAmountToPay,
        chainId: chainId,
        originTokenAddress: originTokenAddress || "",
        sender: activeAccount?.address || "",
      });
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
    throw new Error(error);
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

  const widgetSupportedTokens = {
    // Only native token for testing
    [chain.chainId]: supportedTokens.filter(
      (token) => token.symbol === paymentToken?.symbol,
    ),
  };
  const variant = props.variant || "checkout";

  // const paymentMethods = (
  //   tx.formOfPayment === FOPSchema.enum.CRYPTO ? ["crypto"] : ["card"]
  // ) as ("crypto" | "card")[];
  const paymentMethods = ["crypto", "card"] as ("crypto" | "card")[];

  const paymentCurrency =
    ((isFiatCurrency(tx.totalAmountCurrency)
      ? tx.totalAmountCurrency
      : tx.sale.currency) as SupportedFiatCurrency) || "USD";


  const paymentAmount = totalAmountToPay || "1";

  return (
    <StaggeredRevealAnimation isVisible={mounted}>
      <div className="w-full flex flex-col gap-4 justify-center items-center">
        {variant === "checkout" ? (
          <div>
            <CheckoutWidget
              client={client}
              paymentMethods={paymentMethods}
              currency={paymentCurrency}
              activeWallet={activeWallet}
              chain={defineChain(chainId)}
              amount={paymentAmount}
              tokenAddress={paymentToken?.address as `0x${string}`}
              seller={tx.sale.toWalletsAddress as `0x${string}`}
              image="https://storage.googleapis.com/mjs-public/branding/banner.webp"
              buttonLabel="Proceed with payment"
              name={title}

              onSuccess={(data) => {
                handleSuccessPayment({ variant: "checkout", data });
              }}
              onCancel={() => {
                toast.error("Purchase cancelled by user");
              }}
              onError={(error) => {
                toast.error(error.message);
              }}
              supportedTokens={widgetSupportedTokens}
              feePayer={env.NEXT_PUBLIC_SPONSOR_GAS_FEES ? "seller" : "user"}
            />
          </div>
        ) : (
          <TransactionWidget
            client={client}
            currency={paymentCurrency}
            // chain={defineChain(42161)}
            amount={paymentAmount}
            transaction={handleTransaction(chainId, totalAmountToPay)}
            activeWallet={activeWallet}
            connectOptions={{
              autoConnect: true,
            }}
            image="https://storage.googleapis.com/mjs-public/branding/banner.webp"
            paymentMethods={paymentMethods}
            title={title}
            buttonLabel="Fund your wallet and pay"
            purchaseData={{
              transactionId: tx.id,
            }}
            feePayer={env.NEXT_PUBLIC_SPONSOR_GAS_FEES ? "seller" : "user"}
            supportedTokens={widgetSupportedTokens}
            onSuccess={(data) => {
              handleSuccessPayment({ variant: "transaction", data });
            }}
            onCancel={() => {
              toast.error("Purchase cancelled by user");
            }}
            onError={(error) => {
              toast.error(error.message);
            }}
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <>
            <p>{isSupported ? "Supported" : "Not supported"}</p>
            <p>Payment currency: {tx.totalAmountCurrency}</p>
            <p>token to purchase: {paymentToken?.symbol}</p>
            <Button onClick={handleCheckQuote}>Check quote</Button>
          </>
        )}
      </div>
    </StaggeredRevealAnimation>
  );
};

export const CryptoTransactionWidget = WithErrorHandler(
  CryptoTransactionWidgetComponent,
);

function getSupportedTokens(
  chainId: number | undefined,
  opts: {
    acceptStablecoins: boolean;
    acceptNativeTokens: boolean;
  },
): {
  isSupported: boolean;
  tokens: AppTokenInfo[];
} {
  const acceptAll = (!opts.acceptStablecoins && !opts.acceptNativeTokens)

  if (!chainId) return { isSupported: false, tokens: [] };
  const tokens = Object.values(NETWORK_TO_TOKEN_MAPPING[chainId] || {})
    .map((t) => ({
      name: t.symbol,
      address: t.contract,
      symbol: t.symbol,
      isNative: t.isNative,
      decimals: t.decimals,
      isStablecoin: t.isStablecoin || t.decimals === STABLECOIN_DECIMALS,
    }))
    .filter((token) => {
      // If both flags are false, accept all tokens
      if (acceptAll) {
        return true;
      }
      // Check if token matches any of the enabled filters
      const isStablecoin = token.isStablecoin;
      const isNative = token.isNative;
      const matchesStablecoinFilter = opts.acceptStablecoins && isStablecoin;
      const matchesNativeFilter = opts.acceptNativeTokens && isNative;
      // Include token if it matches at least one enabled filter
      return matchesStablecoinFilter || matchesNativeFilter;
    });

  // Mock that native tokens are supported
  const isSupported = true; // tokens.some((token) => token.isNative);

  return { isSupported, tokens };
}
