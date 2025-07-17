import { TransactionModalTypes } from '@/common/types';
import { SaleWithToken } from '@/common/types/sales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@mjs/ui/primitives/dialog';

interface TokenModalProps {
  open: TransactionModalTypes | null;
  handleModal: (arg: TransactionModalTypes | null) => void;
  sale: SaleWithToken;
}

export const TokenInvestModals = (props: TokenModalProps) => {
  if (!props.open) {
    return null;
  }

  return (
    <Dialog open={!!open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token</DialogTitle>
        </DialogHeader>
        <div>
          {props.open === TransactionModalTypes.Contract && <SaftModal />}
          {props.open === TransactionModalTypes.Loading && <LoadingModal />}
          {props.open === TransactionModalTypes.PendingTx && (
            <PendingTransactionModal />
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
  return <div>Loading</div>;
};

const PendingTransactionModal = () => {
  return <div>Pending Transaction</div>;
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
