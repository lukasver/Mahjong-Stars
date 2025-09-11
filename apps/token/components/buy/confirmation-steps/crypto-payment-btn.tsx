import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { SaleTransactions, TokensOnBlockchains } from "@prisma/client";
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
import useActiveAccount from "@/components/hooks/use-active-account";
import { confirmCryptoTransaction } from "@/lib/actions";
import { client } from "@/lib/auth/thirdweb-client";
import { DialogLoader } from "../dialog-loader";

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
    | "contractAddress"
    | "decimals"
    | "isNative"
    | "chainId"
  >
  | undefined;
  toWallet: string | undefined;
  amount: string;
  disabled?: boolean;
  txId: string;
  extraPayload?: Partial<Pick<SaleTransactions, 'formOfPayment' | 'paidCurrency'>>;
  onSuccess: () => void;
}) {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { activeAccount } = useActiveAccount();

  const { execute } = useActionListener(useAction(confirmCryptoTransaction), {
    onSuccess: () => {
      onSuccess();
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
    if (chain.decimals === 18) {
      const txs = transfer({
        contract,
        amount,
        to: toWallet,
      });

      return txs;
      // ERC-20 with different decimals (USDC or BTC for example)
    } else {
      const txs = prepareContractCall({
        contract,
        method: resolveMethod("transfer"),
        params: [
          activeAccount?.address!,
          toWallet,
          formattedAmount,
        ],
      });
      return txs;
    }
  };

  const handleTxConfirmed: React.ComponentProps<
    typeof TransactionButton
  >["onTransactionConfirmed"] = (receipt) => {
    execute({
      txId,
      receipt: receipt.transactionHash,
      chainId: chain.chainId,
      amountPaid: amount,
      paymentDate: new Date(),
      formOfPayment: 'CRYPTO',
      ...props.extraPayload,
    });
  };

  return (
    <>
      <TransactionButton
        className='w-full'
        disabled={disabled}
        transaction={handleTransaction}
        onTransactionSent={(result) => {
          console.log("Transaction submitted", result.transactionHash);
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
