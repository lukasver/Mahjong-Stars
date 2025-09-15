"use client";
import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { motion, StaggeredRevealAnimation } from "@mjs/ui/components/motion";
import { usePrevious } from "@mjs/ui/hooks";
import { Banner } from "@mjs/ui/primitives/banner";
import { toast } from "@mjs/ui/primitives/sonner";
import Decimal from "decimal.js";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { defineChain, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { BuyWidget, useActiveWallet } from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { FormError } from "@/components/form-error";
import useActiveAccount from "@/components/hooks/use-active-account";
import { PurchaseSummaryCard } from "@/components/invest/summary";
import { client } from "@/lib/auth/thirdweb-client";
import { useBlockchains } from "@/lib/services/api";
import { NETWORK_TO_TOKEN_MAPPING } from "@/lib/services/crypto/config";
import calculator from "@/lib/services/pricefeeds";
import { CryptoPaymentButton } from "../confirmation-steps/crypto-payment-btn";
import { PaymentStatusIndicator } from "../confirmation-steps/payment-status-indicator";
import { PaymentInstructions } from "./instructions";
import { OnRampSkeleton } from "./skeletons";

const WithErrorHandler = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return (props: P) => {
    return (
      <ErrorBoundary
        fallback={
          <FormError
            type="custom"
            title="Error"
            message="An error occurred while processing your request"
          />
        }
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

const OnRampWidgetComponent = ({
  transaction: tx,
  onSuccessPayment,
}: {
  transaction: TransactionByIdWithRelations;
  onSuccessPayment: () => void;
}) => {
  const [mounted, toggleMount] = useState(true);
  const [disabled, setDisabled] = useState(true);
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
  const locale = useLocale();
  const { activeAccount, chainId } = useActiveAccount();
  const prevChainId = usePrevious(chainId);
  const router = useRouter();

  const activeWallet = useActiveWallet();

  const { data, isLoading, error } = useBlockchains(!!activeAccount);

  const chain = data?.chains?.find((chain) => {
    return chain.chainId === chainId;
  });

  const supportedTokens = getSupportedTokens(chain?.chainId);
  const paymentToken = supportedTokens.find((token) => token.isNative);

  useEffect(() => {
    // Refetch prices if user changes chain (which will change the payment token)
    const shouldFetch = prevChainId && chainId && prevChainId !== chainId;
    if ((!isLoading && !amount?.amount && chain) || shouldFetch) {
      async function getEquivalentAmountInCrypto() {
        const newPaidCurrency = paymentToken?.symbol;
        // We should not add fee here but probably add an extra for the gas??
        const result = await calculator.convertCurrency({
          amount: tx.totalAmount.toString(),
          fromCurrency: tx.paidCurrency,
          toCurrency: newPaidCurrency,
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

  const handleSuccessPurcharse = () => {
    toast.success("Purchase successful", {
      description: "Please proceed with payment",
    });
    setDisabled(false);
    router.refresh();
  };

  const handleSuccessPayment = () => {
    onSuccessPayment();
  };

  const handleReadyToPay = () => {
    setDisabled(false);
  };

  return (
    <div className="space-y-4">
      <PurchaseSummaryCard
        purchased={{
          quantity: tx.quantity.toString(),
          tokenSymbol: tx.tokenSymbol,
        }}
        base={tx.quantity.toString()}
        total={tx.quantity.toString()}
        paid={{
          totalAmount: amount.amount || "1",
          currency: amount.currency || tx.paidCurrency,
        }}
        locale={locale}
      />
      <div className="w-full flex flex-col-reverse md:flex-row-reverse justify-between gap-4">
        <div className="shrink-0">
          <StaggeredRevealAnimation isVisible={mounted}>
            <BuyWidget
              currency={tx.paidCurrency}
              client={client}
              title="Get Funds"
              chain={defineChain(chain.chainId)}
              amount={totalAmountToPay || "1"}
              activeWallet={activeWallet}
              paymentMethods={["card"]}
              onSuccess={() => {
                handleSuccessPurcharse();
              }}
              onCancel={() => {
                toast.error("Purchase cancelled by user");
              }}
              onError={(error) => {
                toast.error(error.message);
              }}
              supportedTokens={{
                [chain.chainId]: getSupportedTokens(chain.chainId),
              }}
            />
          </StaggeredRevealAnimation>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex-1 space-y-4"
        >
          <PaymentInstructions />
        </motion.div>
      </div>
      <StaggeredRevealAnimation
        isVisible={Boolean(amount.amount && paymentToken)}
      >
        {amount.amount && paymentToken && (
          <PaymentStatusIndicator
            amount={amount.amount}
            amountToPay={totalAmountToPay}
            tokenAddress={paymentToken?.address}
            isNative={paymentToken?.isNative}
            tokenSymbol={paymentToken?.symbol}
            onReadyToPay={handleReadyToPay}
            onToggleGasFunds={(gasFee) => {
              setAmount((p) => ({ ...p, gasCost: gasFee }));
            }}
          />
        )}
      </StaggeredRevealAnimation>

      <StaggeredRevealAnimation isVisible={!!paymentToken}>
        <Banner
          size={"sm"}
          message={
            <>
              Always ensure you are sending funds to the sale owner wallet:{" "}
              <span className="font-medium text-secondary-500">
                {shortenAddress(tx.sale.toWalletsAddress)}
              </span>
            </>
          }
        />
        <div className="flex flex-col [&>*]:flex-1 [&>*]:w-full gap-2 mt-2">
          {paymentToken && (
            <CryptoPaymentButton
              chain={{
                chainId: chain.chainId,
                isNative: paymentToken?.isNative || false,
                decimals: paymentToken?.decimals || 18,
                contractAddress: paymentToken?.address || NATIVE_TOKEN_ADDRESS,
              }}
              toWallet={tx.sale.toWalletsAddress}
              // Here we should only consider the amount, not the gas cost (totalAmountToPay)
              amount={amount.amount || "0"}
              disabled={disabled || !amount.amount || amount.amount === "0"}
              txId={tx.id}
              onSuccess={handleSuccessPayment}
              extraPayload={{
                formOfPayment: "CRYPTO",
                paidCurrency: paymentToken.symbol,
              }}
            />
          )}
        </div>
      </StaggeredRevealAnimation>
    </div>
  );
};

export const OnRampWidget = WithErrorHandler(OnRampWidgetComponent);

function getSupportedTokens(chainId: number | undefined) {
  if (!chainId) return [];
  return Object.values(NETWORK_TO_TOKEN_MAPPING[chainId] || {}).map((t) => ({
    name: t.symbol,
    address: t.contract,
    symbol: t.symbol,
    isNative: t.isNative,
    decimals: t.decimals,
  }));
}
