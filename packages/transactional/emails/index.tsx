import { ContactFormEmail } from './contact';
import { TestEmail } from './test';
import { EmailVerification } from './verify-email';
import { WaitlistEmail } from './waitlist';
import { WelcomeEmail } from './welcome';
import { ICOSaleEndedEmail } from './sale-ended';
import { UserTransactionNotification } from './user-transaction-confirmed';
import { AdminTransactionNotification } from './admin-transaction-confirmed';
import { ICOSaleOpenedEmail } from './sale-opened';
import { PaymentVerifiedNotification } from './payment-verified';
import { TransactionRejectedNotification } from './transaction-rejected';
import { TransactionCancelledEmail } from './transaction-cancelled';

const templates = {
  contact: ContactFormEmail,
  waitlist: WaitlistEmail,
  test: TestEmail,
  emailVerification: EmailVerification,
  welcome: WelcomeEmail,
  saleEnded: ICOSaleEndedEmail,
  saleOpened: ICOSaleOpenedEmail,
  userTransactionConfirmed: UserTransactionNotification,
  adminTransactionConfirmed: AdminTransactionNotification,
  paymentVerified: PaymentVerifiedNotification,
  transactionRejected: TransactionRejectedNotification,
  transactionCancelled: TransactionCancelledEmail,
};

export { templates };
