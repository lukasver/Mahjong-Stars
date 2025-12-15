import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as styles from "./shared-styles";

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
  paidCurrency?: string;
  status: "CONFIRMED" | "AWAITING_PAYMENT" | "RECONCILIATION_PENDING";
}

/**
 * Gets status-specific configuration for email display
 */
const getStatusConfig = (
  status: "CONFIRMED" | "AWAITING_PAYMENT" | "RECONCILIATION_PENDING"
) => {
  switch (status) {
    case "CONFIRMED":
      return {
        preview: `Transaction confirmed! You've successfully purchased`,
        heading: "🎉 Purchase Confirmed!",
        greeting: "Congratulations! Your purchase of",
        statusBoxStyle: styles.successBox,
        statusMessageStyle: styles.successMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "✅ Confirmed & Completed",
        mainText: "tokens has been processed.",
      };
    case "AWAITING_PAYMENT":
      return {
        preview: `Your transaction has been processed. Payment confirmation pending.`,
        heading: "⏳ Payment Pending",
        greeting: "Your purchase of",
        statusBoxStyle: styles.awaitingPaymentBox,
        statusMessageStyle: styles.awaitingPaymentMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "⏳ Processed - Awaiting Payment Confirmation",
        mainText:
          "tokens has been processed. Your payment is still awaiting confirmation.",
      };
    case "RECONCILIATION_PENDING":
      return {
        preview: `Your payment has been submitted and is under review.`,
        heading: "📋 Payment Under Review",
        greeting: "Your purchase of",
        statusBoxStyle: styles.paymentSubmittedBox,
        statusMessageStyle: styles.paymentSubmittedMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "📋 Processed - Awaiting Admin Approval",
        mainText:
          "tokens has been processed. Your payment has been submitted and is waiting for admin approval and reconciliation.",
      };
    default:
      return {
        preview: `Transaction update`,
        heading: "Transaction Update",
        greeting: "Your purchase of",
        statusBoxStyle: styles.successBox,
        statusMessageStyle: styles.successMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "Processed",
        mainText: "tokens has been processed.",
      };
  }
};

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
  dashboardUrl = "#",
  transactionUrl,
  supportEmail = "support@company.com",
  paidCurrency,
  status,
}: UserTransactionConfirmationProps) => {
  const statusConfig = getStatusConfig(status);

  return (
    <Html>
      <Head />
      <Preview>
        {statusConfig.preview} {tokenAmount} {tokenSymbol}
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.h1}>{statusConfig.heading}</Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hello {userName},</Text>

            <Text style={styles.paragraph}>
              {statusConfig.greeting}{" "}
              <strong>
                {tokenName} ({tokenSymbol})
              </strong>{" "}
              {statusConfig.mainText}
            </Text>

            <Section style={statusConfig.statusBoxStyle}>
              <Text style={styles.successTitle}>{statusConfig.statusTitle}</Text>
              <Text style={statusConfig.statusMessageStyle}>
                {statusConfig.statusMessage}
              </Text>
            </Section>

            <Hr style={styles.divider} />

            <Section style={styles.detailsSection}>
              <Heading style={styles.h2}>Your Purchase Summary</Heading>

              <Text style={styles.detailItem}>
                <strong>Amount Paid:</strong> {purchaseAmount} {paidCurrency}
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
              {paymentMethod === "CRYPTO" ? (
                <>
                  <Text style={styles.h3}>Transaction Hash:</Text>
                  <Text style={styles.transactionHash}>{transactionHash}</Text>
                  {transactionUrl && (
                    <Link href={transactionUrl} style={styles.link}>
                      View on Blockchain Explorer →
                    </Link>
                  )}
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
              {status === "AWAITING_PAYMENT" && (
                <>
                  <Text style={styles.listItem}>
                    • Your payment is being processed and verified
                  </Text>
                  <Text style={styles.listItem}>
                    • Once payment is confirmed, your transaction will proceed to token distribution
                  </Text>
                </>
              )}
              {status === "PAYMENT_SUBMITTED" && (
                <>
                  <Text style={styles.listItem}>
                    • Our team is reviewing your payment submission
                  </Text>
                  <Text style={styles.listItem}>
                    • We'll verify and reconcile your payment within 1-3 business days
                  </Text>
                  <Text style={styles.listItem}>
                    • You'll receive an email notification once your payment is verified
                  </Text>
                </>
              )}
              {status === "CONFIRMED" && (
                <>
                  {paymentMethod === 'TRANSFER' && (
                    <Text style={styles.listItem}>
                      • Your bank transfer has been confirmed and verified
                    </Text>
                  )}
                  <Text style={styles.listItem}>
                    • Your transaction is eligible for token distribution
                  </Text>
                </>
              )}
              <Text style={styles.listItem}>
                • You'll receive updates on token distribution timeline
              </Text>
              <Text style={styles.listItem}>
                • Access exclusive investor updates and project milestones
              </Text>
              <Text style={styles.listItem}>
                • Monitor your investment from your dashboard
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
              contact us at{" "}
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
};

UserTransactionNotification.PreviewProps = {
  userName: "John Doe",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  purchaseAmount: "1,000 USDC",
  tokenAmount: "10,000",
  transactionHash:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  transactionTime: "2024-01-15 14:30:00 UTC",
  paymentMethod: "CRYPTO",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  vestingSchedule: "6-month cliff, 24-month linear vesting",
  distributionDate: "2024-02-15",
  dashboardUrl: "https://dashboard.example.com",
  transactionId: "1234567890",
  transactionUrl:
    "https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  supportEmail: "support@example.com",
  paidCurrency: "USDC",
  status: "CONFIRMED",
} satisfies UserTransactionConfirmationProps;

export default UserTransactionNotification;
