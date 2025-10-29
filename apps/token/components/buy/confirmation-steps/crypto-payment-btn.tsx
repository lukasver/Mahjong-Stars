import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { SaleTransactions, TokensOnBlockchains } from "@prisma/client";
import { InferSafeActionFnResult } from "next-safe-action";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import {
  defineChain,
  getContract,
  NATIVE_TOKEN_ADDRESS,
  prepareContractCall,
  prepareTransaction,
  resolveMethod,
  toUnits,
} from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionButton } from "thirdweb/react";
import { FOPSchema } from "@/common/schemas/generated";
import useActiveAccount from "@/components/hooks/use-active-account";
import { confirmCryptoTransaction } from "@/lib/actions";
import { client } from "@/lib/auth/thirdweb-client";
import { DialogLoader } from "../dialog-loader";
import { SuccessCryptoPaymentData } from "../widgets/transaction";

export function CryptoPaymentButton({
  chain,
  toWallet,
  amount,
  disabled,
  txId,
  onSuccess,
  ...props
}: {
  chain:
  | Pick<
    TokensOnBlockchains,
    "contractAddress" | "decimals" | "isNative" | "chainId"
  >
  | undefined;
  toWallet: string | undefined;
  amount: string;
  disabled?: boolean;
  txId: string;
  extraPayload?: Partial<
    Pick<SaleTransactions, "formOfPayment" | "paidCurrency">
  >;

  onSuccess: (d: SuccessCryptoPaymentData) => void;
}) {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { activeAccount } = useActiveAccount();

  const { execute } = useActionListener(useAction(confirmCryptoTransaction), {
    onSuccess: (d) => {
      const data = d as InferSafeActionFnResult<
        typeof confirmCryptoTransaction
      >;
      onSuccess({
        transactionHash: data.data?.transaction.txHash || "",
        chainId: data.data?.transaction?.blockchain?.chainId || 0,
        amountPaid: data.data?.transaction.amountPaid || "",
        paidCurrency: data.data?.transaction.paidCurrency || "",
        formOfPayment:
          data.data?.transaction.formOfPayment || FOPSchema.enum.CRYPTO,
        paymentDate: data.data?.transaction.paymentDate || new Date(),
      });
      setIsTransactionDialogOpen(false);
    },
    onError: (error) => {
      console.error("Transaction error", error);
      setIsTransactionDialogOpen(false);
    },
  });

  if (!chain) {
    return null;
  }

  if (!chain.contractAddress) {
    return null;
  }

  if (!toWallet) {
    return null;
  }
  if (!txId) {
    return null;
  }

  const handleTransaction = () => {
    const contract = getContract({
      client: client,
      chain: defineChain(chain.chainId),
      address: chain.contractAddress!,
    });

    const formattedAmount = toUnits(amount, chain.decimals);

    // Native token
    if (chain.isNative || chain.contractAddress === NATIVE_TOKEN_ADDRESS) {
      return prepareTransaction({
        chain: defineChain(chain.chainId),
        client: client,
        value: formattedAmount,
        to: toWallet,
      });
    }
    // ERC-20
    if (chain.decimals) {
      console.log("ENTRANDO A ERC20", contract, amount);
      const txs = transfer({
        contract,
        amount,
        to: toWallet,
      });

      return txs;
      // Native BTC for example? :think
    } else {
      throw new Error("NOT IMPLEMENTED");
      const txs = prepareContractCall({
        contract,
        method: resolveMethod("transfer"),
        params: [activeAccount?.address!, toWallet, formattedAmount],
      });
      return txs;
    }
  };

  const handleTxConfirmed: React.ComponentProps<
    typeof TransactionButton
  >["onTransactionConfirmed"] = (receipt) => {
    const payload = {
      txId,
      receipt: receipt.transactionHash,
      chainId: chain.chainId,
      amountPaid: amount,
      paymentDate: new Date(),
      ...(props.extraPayload && { extraPayload: props.extraPayload }),
    } as Parameters<typeof execute>[0];
    execute(payload);
  };

  return (
    <>
      <TransactionButton
        className="w-full"
        disabled={disabled}
        transaction={handleTransaction}
        onTransactionSent={(result) => {
          setTransactionHash(result.transactionHash);
          setIsTransactionDialogOpen(true);
        }}
        onTransactionConfirmed={handleTxConfirmed}
        onError={(error) => {
          console.error("Transaction error", error);
          setIsTransactionDialogOpen(false);
        }}
      >
        Proceed to pay
      </TransactionButton>
      {/* {process.env.NODE_ENV === "development" && (
        <Button
          onClick={() =>
            simulateTx({
              transaction: handleTransaction(),
              account: activeAccount,
            })
          }
        >
          Simulate
        </Button>
      )} */}

      <DialogLoader
        title="Processing Transaction"
        description="Your transaction is being processed on the blockchain. Please do not close this window."
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        isAlertDialog={true}
      >
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">Transaction Hash:</p>
          <p className="text-xs font-mono break-all mt-1">{transactionHash}</p>
        </div>
      </DialogLoader>
    </>
  );
}
