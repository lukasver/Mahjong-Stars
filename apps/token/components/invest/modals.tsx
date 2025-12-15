import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@mjs/ui/primitives/alert-dialog";
import { Button } from "@mjs/ui/primitives/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mjs/ui/primitives/dialog";
import { TransactionStatus } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef } from "react";
import { TransactionModalTypes } from "@/common/types";
import { SaleWithToken } from "@/common/types/sales";
import { deleteOwnTransaction } from "@/lib/actions";
import { usePendingTransactionsForSale } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import MahjongStarsIconXl from "@/public/static/images/logos/isologo.webp";
import { PurchaseSummaryCard } from "./summary";

interface TokenModalProps {
  open: TransactionModalTypes | null;
  handleModal: (arg: TransactionModalTypes | null) => void;
  sale: SaleWithToken;
}

const titleMapping = {
  [TransactionModalTypes.PendingTx]: {
    title: "You have a pending transaction",
    description: "Please review the details of your pending transaction.",
  },
  [TransactionModalTypes.WalletLogin]: {
    title: "Wallet Login",
    description: "Please connect your wallet to continue.",
  },
  [TransactionModalTypes.Contract]: {
    title: "Review Contract",
    description: "Please review and sign the contract to continue.",
  },
  [TransactionModalTypes.Loading]: {
    title: "Processing",
    description: "Please wait while we process your request.",
  },
  [TransactionModalTypes.ConfirmPayment]: {
    title: "Confirm Payment",
    description: "Please confirm your payment details.",
  },
  [TransactionModalTypes.ManualTransfer]: {
    title: "Bank Transfer Details",
    description: "Please use these details to complete your bank transfer.",
  },
  [TransactionModalTypes.CryptoWarning]: {
    title: "Crypto Payment Warning",
    description: "Please review important information about crypto payments.",
  },
  [TransactionModalTypes.PendingContract]: {
    title: "Pending Contract",
    description: "You have a contract waiting to be signed.",
  },
  [TransactionModalTypes.UploadKyc]: {
    title: "Upload KYC",
    description: "Please upload your KYC documents to continue.",
  },
  [TransactionModalTypes.VerifyEmail]: {
    title: "Verify Email",
    description: "Please verify your email address to continue.",
  },
} satisfies Record<
  TransactionModalTypes,
  { title: string; description: string }
>;

export const TokenInvestModals = (props: TokenModalProps) => {
  if (!props.open || props.open === TransactionModalTypes.VerifyEmail) {
    return null;
  }

  return (
    <Dialog
      open={!!props.open}
      onOpenChange={(open) => props.handleModal(open ? props.open : null)}
    >
      <DialogContent>
        <DialogHeader>
          {props.open && (
            <DialogTitle>{titleMapping[props.open]?.title}</DialogTitle>
          )}
          {props.open && (
            <DialogDescription>
              {titleMapping[props.open]?.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div>
          {props.open === TransactionModalTypes.Contract && <SaftModal />}
          {props.open === TransactionModalTypes.Loading && <LoadingModal />}
          {props.open === TransactionModalTypes.PendingTx && (
            <PendingTransactionModal
              sale={props.sale}
              onClose={() => props.handleModal(null)}
            />
          )}
          {props.open === TransactionModalTypes.WalletLogin && (
            <WalletLoginModal />
          )}
          {props.open === TransactionModalTypes.ConfirmPayment && (
            <ConfirmPaymentModal />
          )}
          {props.open === TransactionModalTypes.ManualTransfer && (
            <BankTransferModal />
          )}
          {props.open === TransactionModalTypes.CryptoWarning && (
            <CryptoWarningModal />
          )}
          {props.open === TransactionModalTypes.PendingContract && (
            <SaftModal />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LoadingModal = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="aspect-square animate-pulse">
        <Image
          height={80}
          width={80}
          src={MahjongStarsIconXl}
          alt="The Tiles Company Logo"
          className="animate-spin aspect-square"
        />
      </span>
      <span className="text-xl font-bold font-head">Loading...</span>
    </div>
  );
};

const PendingTransactionModal = ({
  sale,
  onClose,
}: {
  sale: SaleWithToken;
  onClose: () => void;
}) => {
  const { data, isLoading } = usePendingTransactionsForSale(sale.id);
  const locale = useLocale();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { execute, isPending } = useActionListener(
    useAction(deleteOwnTransaction),
    {
      onSuccess: () => {
        getQueryClient().invalidateQueries({
          queryKey: ["transactions"],
        });
        buttonRef.current?.click();
      },
    },
  );

  const tx = data?.transactions?.find(
    (t) =>
      t.status === TransactionStatus.PENDING ||
      t.status === TransactionStatus.AWAITING_PAYMENT,
  );

  useEffect(() => {
    if (!tx && !isLoading) {
      onClose?.();
    }
  }, [tx, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="aspect-square animate-pulse">
          <Image
            height={80}
            width={80}
            src={MahjongStarsIconXl}
            alt="The Tiles Company Logo"
            className="animate-spin aspect-square"
          />
        </span>
        <span className="text-xl font-bold font-head">Loading...</span>
      </div>
    );
  }

  if (!tx) {
    return null;
  }

  const handleDeleteTx = () => {
    execute({ id: tx.id });
  };

  const handleConfirmTx = () => {
    router.push(`/dashboard/buy/${tx.id}`);
  };

  return (
    <div className="space-y-4">
      <PurchaseSummaryCard
        locale={locale}
        purchased={{
          quantity: tx.quantity.toString(),
          tokenSymbol: sale.tokenSymbol,
        }}
        // base={tx.base}
        // bonus={tx.bonus}
        total={tx.quantity.toString()}
        paid={{
          totalAmount: tx.totalAmount.toString(),
          currency: tx.paidCurrency,
        }}
      />

      <Alert className="bg-secondary-800/50 border-secondary">
        <AlertCircle className="h-4 w-4 text-secondary" />
        <AlertDescription className="text-white/90">
          <span className="font-bold">Action required:</span> Only one
          transaction is allowed at a time. Please resolve the current
          transaction to start a new one.
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <div className="flex-1">
          <DialogClose asChild ref={buttonRef}>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
        </div>
        <div className="flex shrink-0 gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant={"outlineSecondary"} loading={isPending}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                <AlertDialogDescription className="text-foreground">
                  Are you sure you want to delete this transaction? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTx}
                  className="bg-destructive text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant={"accent"}
            onClick={handleConfirmTx}
            disabled={isPending}
            loading={isPending}
          >
            Confirm
          </Button>
        </div>
      </div>
      {/* <SubmitButton form={form} onSubmit={handleSubmit} /> */}
    </div>
  );
};

const WalletLoginModal = () => {
  return <div>Wallet Login</div>;
};

const ConfirmPaymentModal = () => {
  return <div>Confirm Payment</div>;
};

const BankTransferModal = () => {
  return <div>BankTransferModal</div>;
};

const CryptoWarningModal = () => {
  return <div>CryptoWarning</div>;
};

const SaftModal = () => {
  return <div>SaftModal</div>;
};
