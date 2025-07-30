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

interface UserTransactionConfirmationProps {
  userName: string;
  tokenName: string;
  tokenSymbol: string;
  purchaseAmount: string;
  tokenAmount: string;
  transactionHash: string;
  transactionTime: string;
  paymentMethod: string;
  walletAddress: string;
  vestingSchedule?: string;
  distributionDate?: string;
  dashboardUrl?: string;
  transactionUrl?: string;
  transactionId?: string;
  supportEmail?: string;
}

export const UserTransactionNotification = ({
  userName,
  tokenName,
  tokenSymbol,
  purchaseAmount,
  tokenAmount,
  transactionHash,
  transactionTime,
  paymentMethod,
  walletAddress,
  vestingSchedule,
  transactionId,
  distributionDate,
  dashboardUrl = '#',
  transactionUrl = '#',
  supportEmail = 'support@company.com',
}: UserTransactionConfirmationProps) => (
  <Html>
    <Head />
    <Preview>
      Transaction confirmed! You've successfully purchased {tokenAmount}{' '}
      {tokenSymbol}
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>🎉 Purchase Confirmed!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Congratulations! Your purchase of{' '}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{' '}
            tokens has been successfully confirmed and processed.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Transaction Status:</Text>
            <Text style={styles.successMessage}>✅ Confirmed & Completed</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Your Purchase Summary</Heading>

            <Text style={styles.detailItem}>
              <strong>Amount Paid:</strong> {purchaseAmount}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Tokens Purchased:</strong> {tokenAmount} {tokenSymbol}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Payment Method:</strong> {paymentMethod}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Your Wallet:</strong> {walletAddress}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Transaction Date:</strong> {transactionTime}
            </Text>

            {vestingSchedule && (
              <Text style={styles.detailItem}>
                <strong>Vesting Schedule:</strong> {vestingSchedule}
              </Text>
            )}

            {distributionDate && (
              <Text style={styles.detailItem}>
                <strong>Token Distribution:</strong> {distributionDate}
              </Text>
            )}
          </Section>

          <Section style={styles.transactionBox}>
            {paymentMethod === 'CRYPTO' ? (
              <>
                <Text style={styles.h3}>Transaction Hash:</Text>
                <Text style={styles.transactionHash}>{transactionHash}</Text>
                <Link href={transactionUrl} style={styles.link}>
                  View on Blockchain Explorer →
                </Link>
              </>
            ) : (
              <>
                <Text style={styles.h3}>Transaction ID:</Text>
                <Text style={styles.transactionHash}>{transactionId}</Text>
              </>
            )}
          </Section>

          <Hr style={styles.divider} />

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
            <Heading style={styles.h3}>What Happens Next?</Heading>
            <Text style={styles.listItem}>
              • Your tokens are securely allocated to your wallet address
            </Text>
            <Text style={styles.listItem}>
              • You'll receive updates on token distribution timeline
            </Text>
            <Text style={styles.listItem}>
              • Access exclusive investor updates and project milestones
            </Text>
            <Text style={styles.listItem}>
              • Monitor your investment performance in real-time
            </Text>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Important Reminders:</Heading>
            <Text style={styles.listItem}>
              • Keep this email as proof of purchase
            </Text>
            <Text style={styles.listItem}>
              • Ensure your wallet address is secure and accessible
            </Text>
            <Text style={styles.listItem}>
              • Join our community channels for project updates
            </Text>
            <Text style={styles.listItem}>
              • Review the token distribution schedule in your dashboard
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            Thank you for your investment! If you have any questions, please
            contact us at{' '}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Welcome to the community!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

UserTransactionNotification.PreviewProps = {
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
  vestingSchedule: '6-month cliff, 24-month linear vesting',
  distributionDate: '2024-02-15',
  dashboardUrl: 'https://dashboard.example.com',
  transactionId: '1234567890',
  transactionUrl:
    'https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  supportEmail: 'support@example.com',
} satisfies UserTransactionConfirmationProps;

export default UserTransactionNotification;
