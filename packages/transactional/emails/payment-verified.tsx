import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from '@react-email/components';
import * as styles from './shared-styles';

interface PaymentVerifiedProps {
  userName: string;
  tokenName: string;
  tokenSymbol: string;
  purchaseAmount: string;
  tokenAmount: string;
  transactionHash?: string;
  transactionTime: string;
  paymentMethod: string;
  walletAddress: string;
  transactionId?: string;
  dashboardUrl?: string;
  transactionUrl?: string;
  supportEmail?: string;
  paidCurrency?: string;
}

export const PaymentVerifiedNotification = ({
  userName,
  tokenName,
  tokenSymbol,
  purchaseAmount,
  tokenAmount,
  transactionHash,
  transactionTime,
  paymentMethod,
  walletAddress,
  transactionId,
  dashboardUrl = '#',
  transactionUrl,
  supportEmail = 'support@company.com',
  paidCurrency,
}: PaymentVerifiedProps) => (
  <Html>
    <Head />
    <Preview>
      Payment verified! Your transaction has been confirmed by our team
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>✅ Payment Verified!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Great news! Your payment for{' '}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{' '}
            tokens has been verified and confirmed by our team.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Payment Status:</Text>
            <Text style={styles.successMessage}>✅ Verified & Confirmed</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Transaction Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Amount Paid:</strong> {purchaseAmount} {paidCurrency}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Tokens Allocated:</strong> {tokenAmount} {tokenSymbol}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Payment Method:</strong> {paymentMethod}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Your Wallet:</strong> {walletAddress}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Verification Date:</strong> {transactionTime}
            </Text>

            {transactionHash && (
              <Text style={styles.detailItem}>
                <strong>Transaction Hash:</strong> {transactionHash}
              </Text>
            )}

            {transactionId && (
              <Text style={styles.detailItem}>
                <strong>Transaction ID:</strong> {transactionId}
              </Text>
            )}
          </Section>

          {transactionUrl && (
            <Section style={styles.transactionBox}>
              <Link href={transactionUrl} style={styles.link}>
                View Transaction Details →
              </Link>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What Happens Next?</Heading>
            <Text style={styles.listItem}>
              • Your tokens are now securely allocated and verified
            </Text>
            <Text style={styles.listItem}>
              • You'll receive updates on token distribution timeline
            </Text>
            <Text style={styles.listItem}>
              • Stay tuned for important announcements about token release
            </Text>
            <Text style={styles.listItem}>
              • Access exclusive investor updates and project milestones
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Track your investment and view detailed analytics in your personal
              dashboard.
            </Text>

            <Button style={styles.button} href={dashboardUrl}>
              View My Dashboard
            </Button>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Stay Connected</Heading>
            <Text style={styles.paragraph}>
              We'll keep you updated on all important developments regarding
              token release and distribution. Make sure to:
            </Text>
            <Text style={styles.listItem}>
              • Check your email regularly for updates
            </Text>
            <Text style={styles.listItem}>
              • Monitor your dashboard for distribution announcements
            </Text>
            <Text style={styles.listItem}>
              • Join our community channels for real-time updates
            </Text>
            <Text style={styles.listItem}>
              • Follow our social media for project milestones
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            Thank you for your patience during the verification process! If you
            have any questions, please contact us at{' '}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Welcome to the verified investor community!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

PaymentVerifiedNotification.PreviewProps = {
  userName: 'John Doe',
  tokenName: 'MyToken',
  tokenSymbol: 'MTK',
  purchaseAmount: '1,000 USDC',
  tokenAmount: '10,000',
  transactionHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionTime: '2024-01-15 14:30:00 UTC',
  paymentMethod: 'CRYPTO',
  walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  transactionId: '1234567890',
  dashboardUrl: 'https://dashboard.example.com',
  transactionUrl:
    'https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  supportEmail: 'support@example.com',
  paidCurrency: 'USDC',
} satisfies PaymentVerifiedProps;

export default PaymentVerifiedNotification;
