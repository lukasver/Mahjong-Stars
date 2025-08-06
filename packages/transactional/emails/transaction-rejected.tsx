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

interface TransactionRejectedProps {
  userName: string;
  tokenName: string;
  tokenSymbol: string;
  purchaseAmount: string;
  transactionHash?: string;
  transactionTime: string;
  paymentMethod: string;
  walletAddress: string;
  transactionId?: string;
  rejectionReason?: string;
  supportEmail?: string;
  paidCurrency?: string;
}

export const TransactionRejectedNotification = ({
  userName,
  tokenName,
  tokenSymbol,
  purchaseAmount,
  transactionHash,
  transactionTime,
  paymentMethod,
  walletAddress,
  transactionId,
  rejectionReason,
  supportEmail = 'hello@mahjonstars.com',
  paidCurrency,
}: {
  userName: string;
  tokenName: string;
  tokenSymbol: string;
  purchaseAmount: string;
  transactionHash?: string;
  transactionTime: string;
  paymentMethod: string;
  walletAddress: string;
  transactionId?: string;
  rejectionReason?: string;
  supportEmail?: string;
  paidCurrency?: string;
}) => (
  <Html>
    <Head />
    <Preview>
      Transaction rejected - Important information about your purchase
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>❌ Transaction Rejected</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            We regret to inform you that your purchase of{' '}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{' '}
            tokens has been rejected by our verification team.
          </Text>

          <Section style={styles.errorBox}>
            <Text style={styles.errorTitle}>Transaction Status:</Text>
            <Text style={styles.errorMessage}>❌ Rejected</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Transaction Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Amount Attempted:</strong> {purchaseAmount} {paidCurrency}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Payment Method:</strong> {paymentMethod}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Wallet Address:</strong> {walletAddress}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Transaction Date:</strong> {transactionTime}
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

          {rejectionReason && (
            <Section style={styles.reasonSection}>
              <Heading style={styles.h3}>Reason for Rejection:</Heading>
              <Text style={styles.paragraph}>{rejectionReason}</Text>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What You Can Do:</Heading>
            <Text style={styles.listItem}>
              • Contact our support team if you believe this is an error
            </Text>
            <Text style={styles.listItem}>
              • Request a refund if you've already made the payment
            </Text>
            <Text style={styles.listItem}>
              • Review our terms and conditions for purchase requirements
            </Text>
            <Text style={styles.listItem}>
              • Try again with corrected information if applicable
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              If you have any questions or believe this rejection is incorrect,
              please don't hesitate to reach out to our support team.
            </Text>

            <Button style={styles.button} href={`mailto:${supportEmail}`}>
              Contact Support
            </Button>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Support Information:</Heading>
            <Text style={styles.paragraph}>
              Our support team is available to help you with:
            </Text>
            <Text style={styles.listItem}>
              • Clarifying the reason for rejection
            </Text>
            <Text style={styles.listItem}>• Processing refund requests</Text>
            <Text style={styles.listItem}>• Resolving technical issues</Text>
            <Text style={styles.listItem}>
              • Providing guidance for future purchases
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            We apologize for any inconvenience this may have caused. Please
            contact us at{' '}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>{' '}
            if you need assistance or have any questions.
          </Text>

          <Text style={styles.signature}>
            Thank you for your understanding.
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

TransactionRejectedNotification.PreviewProps = {
  userName: 'John Doe',
  tokenName: 'MyToken',
  tokenSymbol: 'MTK',
  purchaseAmount: '1,000 USDC',
  transactionHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionTime: '2024-01-15 14:30:00 UTC',
  paymentMethod: 'CRYPTO',
  walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  transactionId: '1234567890',
  rejectionReason:
    'Payment verification failed due to insufficient funds or invalid payment method.',
  supportEmail: 'support@example.com',
  paidCurrency: 'USDC',
} satisfies TransactionRejectedProps;

export default TransactionRejectedNotification;
