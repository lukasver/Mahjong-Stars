"use client";

import { motion } from "@mjs/ui/components/motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mjs/ui/primitives/tabs";
import { metadata as siteConfig } from "@/common/config/site";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { FormError } from "@/components/form-error";
import useActiveAccount from "@/components/hooks/use-active-account";
import { SwitchNetworkButton } from "@/components/switch-network-button";
import { useCryptoTransaction } from "@/lib/services/api";
import { OnRampWidget } from "../widgets/onramp";
import {
  CryptoTransactionWidget,
  SuccessCryptoPaymentData,
} from "../widgets/transaction";
import { CryptoManualPaymentForm } from "./payment-step-crypto-manual";

type CryptoPaymentProps = {
  tx: TransactionByIdWithRelations;
  onSuccess: (d: SuccessCryptoPaymentData) => void;
  mode?: "widget" | "manual" | "both";
  isPending?: boolean;
};

export const CryptoPayment = ({
  tx,
  onSuccess,
  ...props
}: CryptoPaymentProps) => {
  const { mode = "both" } = props;
  const { chainId } = useActiveAccount();

  const {
    data: cryptoTransaction,
    isLoading,
    error,
  } = useCryptoTransaction(tx.id, { chainId: chainId || 0 });

  return (
    <div className="py-2 text-center space-y-4">
      {/* Balance Checker */}
      {error ? (
        <FormError type="custom" title="Error" message={error} />
      ) : !cryptoTransaction?.paymentToken || !cryptoTransaction?.blockchain ? (
        <FormError
          type="switch-network"
          title="Error"
          message="Payment with this token not supported on this network, please try a different network"
        >
          <div className="w-full flex justify-center">
            <SwitchNetworkButton />
          </div>
        </FormError>
      ) : (
        !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {mode === 'widget' && <CryptoPaymentComponent
              transaction={tx}
              onSuccessPayment={onSuccess}
            />}
            {mode === 'manual' && <CryptoManualPaymentForm transaction={tx} onSuccess={onSuccess} />}
            {mode === 'both' &&
              <Tabs
                defaultValue={"widget"}
              >
                <TabsList>
                  <TabsTrigger value="widget">Connected Wallet</TabsTrigger>
                  <TabsTrigger value="manual">Manual Payment</TabsTrigger>
                </TabsList>
                <TabsContent value="widget">
                  <CryptoPaymentComponent
                    transaction={tx}
                    onSuccessPayment={onSuccess}

                  />
                </TabsContent>
                <TabsContent value="manual">
                  <CryptoManualPaymentForm transaction={tx} onSuccess={onSuccess}
                    isSubmitting={props.isPending}
                  />
                </TabsContent>
              </Tabs>}
          </motion.div>
        )
      )}
    </div>
  );
};

type CryptoComponentProps = {
  mode?: "transaction" | "onramp";
  transaction: TransactionByIdWithRelations;
  onSuccessPayment: (d: SuccessCryptoPaymentData) => void;

  /**
   * Toggle true to enble user to pay with FIAT via thirdweb providers
   */
  showHelp?: boolean;
};

export const CryptoPaymentComponent = (props: CryptoComponentProps) => {
  const { mode = "transaction", ...rest } = props;

  return mode === "transaction" ? (
    <div className="space-y-4">
      {props.showHelp && (
        <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600 max-w-[398px] mx-auto">
          <h4 className="text-secondary-300 font-medium">Important notice:</h4>
          <div className="space-y-2 text-sm">
            <p>
              Payments with credit card are processed by external payment
              providers. <br />
              You will be redirected to fund your current wallet with the
              required amount of crypto to pay for the tokens.
              <br />
              This process can take a couple minutes, please do not close this
              page.
            </p>
          </div>
        </div>
      )}
      <CryptoTransactionWidget {...rest} />
      <p className="text-center">
        Need help?{" "}
        <a
          className="transition-all text-secondary-300 hover:underline hover:text-secondary-500"
          href={`mailto:${siteConfig.supportEmail}`}
        >
          Contact support
        </a>
      </p>
    </div>
  ) : (
    <OnRampWidget {...rest} />
  );
};
