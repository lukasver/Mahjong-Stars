import { TransactionStatusSchema, User } from '@/common/schemas/generated';
import { TransactionModalTypes } from '@/common/types';
// import { UrlContract } from '@/services/adobe.service';
import { FOP, SaleTransactions, TransactionStatus } from '@prisma/client';

const fopMapping = {
  [FOP.CRYPTO]: TransactionModalTypes.CryptoWarning,
  [FOP.TRANSFER]: TransactionModalTypes.ManualTransfer,
  [FOP.CARD]: null, // NOT IMPLEMENTED
};

/**
 * This function centralizes the logic to open the correct modal based on the transaction status
 * @param {SaleTransactions} transaction
 */
export const getTransactionModalTypeToOpen = (
  transaction?: SaleTransactions,
  user?: User,
  contract?: { isSign: boolean; urlSign: string | null }
): null | TransactionModalTypes => {
  if (!transaction || !user) return null;

  // NOT IMPLEMENTED
  if (transaction.formOfPayment === FOP.CARD) {
    return null;
  }

  // Flow for SIWE users
  if (user.isSiwe) {
    //TODO need logic here
    return null;
  } else {
    // Flow for non-SIWE users
    switch (transaction.status) {
      case TransactionStatus.PENDING:
        // If the transaction has an existing agreementID then we know user signed it or needs to sign it
        if (transaction.agreementId) {
          // contract is signed by user
          if (contract?.isSign) {
            return fopMapping[transaction.formOfPayment];
            // contract needs to be signed by user
          } else {
            return TransactionModalTypes.Contract;
          }
          // If the transaction has no agreementID then we know user needs to sign it
          // TODO! revise this...
        } else {
          return fopMapping[transaction.formOfPayment];
        }

      case TransactionStatusSchema.enum.CANCELLED:
        return null; //TODO! IMPLEMENT
      case TransactionStatusSchema.enum.PAYMENT_SUBMITTED:
        return null; //TODO! IMPLEMENT
      case TransactionStatusSchema.enum.PAYMENT_VERIFIED:
        return null; //TODO! IMPLEMENT
      case TransactionStatusSchema.enum.REJECTED:
        return null; //TODO! IMPLEMENT
      default:
        return null;
    }
  }
};
