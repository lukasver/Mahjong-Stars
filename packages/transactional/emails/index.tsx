import { ContactFormEmail } from './contact';
import { TestEmail } from './test';
import { EmailVerification } from './verify-email';
import { WaitlistEmail } from './waitlist';
import { WelcomeEmail } from './welcome';
import { ICOSaleEndedEmail } from './sale-ended';
import { UserTransactionNotification } from './user-transaction-confirmed';
import { AdminTransactionNotification } from './admin-transaction-confirmed';

const templates = {
  contact: ContactFormEmail,
  waitlist: WaitlistEmail,
  test: TestEmail,
  emailVerification: EmailVerification,
  welcome: WelcomeEmail,
  saleEnded: ICOSaleEndedEmail,
  userTransactionConfirmed: UserTransactionNotification,
  adminTransactionConfirmed: AdminTransactionNotification,
};

export { templates };
