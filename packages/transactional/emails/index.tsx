import { AdminTransactionNotification } from "./admin-transaction-confirmed";
import { ContactFormEmail } from "./contact";
import { KycRejectedEmail } from "./kyc-rejected";
import { KycVerifiedEmail } from "./kyc-verified";
import { PaymentReminderEmail } from "./payment-reminder";
import { PaymentVerifiedNotification } from "./payment-verified";
import { PostRegistrationWelcomeEmail } from "./post-registration-welcome";
import { RefundProcessedEmail } from "./refund-processed";
import { SaleClosingSoonEmail } from "./sale-closing-soon";
import { ICOSaleEndedEmail } from "./sale-ended";
import { SaleMilestoneEmail } from "./sale-milestone";
import { ICOSaleOpenedEmail } from "./sale-opened";
import { SaleStartingSoonEmail } from "./sale-starting-soon";
import { SecurityAlertEmail } from "./security-alert";
import { TestEmail } from "./test";
import { TokensDistributedEmail } from "./tokens-distributed";
import { TransactionCancelledEmail } from "./transaction-cancelled";
import { TransactionRejectedNotification } from "./transaction-rejected";
import { UserTransactionNotification } from "./user-transaction-confirmed";
import { EmailVerification } from "./verify-email";
import { WaitlistEmail } from "./waitlist";
import { WelcomeEmail } from "./welcome";

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
  postRegistrationWelcome: PostRegistrationWelcomeEmail,
  kycVerified: KycVerifiedEmail,
  kycRejected: KycRejectedEmail,
  tokensDistributed: TokensDistributedEmail,
  refundProcessed: RefundProcessedEmail,
  paymentReminder: PaymentReminderEmail,
  saleStartingSoon: SaleStartingSoonEmail,
  saleClosingSoon: SaleClosingSoonEmail,
  saleMilestone: SaleMilestoneEmail,
  securityAlert: SecurityAlertEmail,
};

export { templates };
