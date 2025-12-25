"use client";

import { motion } from "@mjs/ui/components/motion";
import { Tabs, TabsContent } from "@mjs/ui/primitives/tabs";
import { FOPSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { SuccessInstaxchangePaymentData } from "../widgets/instaxchange";
import { SuccessCryptoPaymentData } from "../widgets/transaction";
import { CardPaymentHandler } from "./card-payment-handler";
import { CryptoPaymentComponent } from "./payment-step-crypto";
import { TransferPaymentHandler } from "./transfer-payment-handler";

export const FiatPayment = ({
  tx,
  onSuccess,
  onSuccessCrypto,
  onSuccessInstaxchange,
}: {
  tx: TransactionByIdWithRelations;
  onSuccess: () => void;
  onSuccessCrypto: (d: SuccessCryptoPaymentData) => void;
  onSuccessInstaxchange: (d: SuccessInstaxchangePaymentData) => void;
}) => {
  // If no banks available or form of payment is CARD, show card payment (Instaxchange or Thirdweb)
  if (
    // (!isBanksLoading && banks?.banks?.length === 0) ||
    tx.formOfPayment === "CARD"
  ) {
    return (
      <CardPaymentHandler
        transaction={tx}
        // onSuccessInstaxchange={onSuccessInstaxchange}
        onSuccessCrypto={onSuccessCrypto}
      />
    );
  }

  return (
    <div className="space-y-4">
      {[FOPSchema.enum.CARD, FOPSchema.enum.TRANSFER].includes(
        tx.formOfPayment,
      ) ? (
        <Tabs value={tx.formOfPayment}>
          <TabsContent value={FOPSchema.enum.CARD}>
            <CardPaymentHandler
              transaction={tx}
              // onSuccessInstaxchange={onSuccessInstaxchange}
              onSuccessCrypto={onSuccessCrypto}
            />
          </TabsContent>
          <TabsContent value={FOPSchema.enum.TRANSFER}>
            <TransferPaymentHandler transaction={tx} onSuccess={onSuccess} />
          </TabsContent>
        </Tabs>
      ) : (
        // Fallback to card payment if no banks available
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <CryptoPaymentComponent
            transaction={tx}
            onSuccessPayment={onSuccessCrypto}
            showHelp
          />
        </motion.div>
      )}
    </div>
  );
};
