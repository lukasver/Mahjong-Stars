import { ContactFormEmail } from './contact';
import { TestEmail } from './test';
import { EmailVerification } from './verify-email';
import { WaitlistEmail } from './waitlist';
import { WelcomeEmail } from './welcome';
import { ICOSaleEndedEmail } from './sale-ended';
import { UserTransactionNotification } from './user-transaction-confirmed';
import { AdminTransactionNotification } from './admin-transaction-confirmed';
import { ICOSaleOpenedEmail } from './sale-opened';

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
};

export { templates };
