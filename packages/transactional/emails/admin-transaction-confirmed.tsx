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

export interface AdminTransactionNotificationProps {
  adminName?: string;
  userName: string;
  userEmail: string;
  tokenName: string;
  tokenSymbol: string;
  purchaseAmount: string;
  tokenAmount: string;
  transactionHash: string;
  transactionTime: string;
  paymentMethod: string;
  walletAddress: string;
  dashboardUrl?: string;
  transactionId?: string;
  transactionUrl?: string;
  supportEmail?: string;
  paidCurrency?: string;
  status: "CONFIRMED" | "AWAITING_PAYMENT" | "RECONCILIATION_PENDING";
}

/**
 * Gets status-specific configuration for admin email display
 */
const getStatusConfig = (
  status: "CONFIRMED" | "AWAITING_PAYMENT" | "RECONCILIATION_PENDING"
) => {
  switch (status) {
    case "CONFIRMED":
      return {
        preview: `Transaction confirmed: Customer purchased`,
        heading: "💰 Transaction Confirmed",
        statusBoxStyle: styles.successBox,
        statusMessageStyle: styles.successMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "✅ Confirmed & Processed",
        mainText: "A new transaction has been successfully confirmed for the",
      };
    case "AWAITING_PAYMENT":
      return {
        preview: `Transaction processed: Payment confirmation pending`,
        heading: "⏳ Payment Processing",
        statusBoxStyle: styles.awaitingPaymentBox,
        statusMessageStyle: styles.awaitingPaymentMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "⏳ Processed - Awaiting Payment Confirmation",
        mainText: "A transaction has been processed and is awaiting payment confirmation for the",
      };
    case "RECONCILIATION_PENDING":
      return {
        preview: `⚠️ ACTION REQUIRED: Payment verification needed`,
        heading: "⚠️ Action Required - Payment Verification",
        statusBoxStyle: styles.paymentSubmittedBox,
        statusMessageStyle: styles.paymentSubmittedMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "📋 Processed - Manual Verification Required",
        mainText: "A transaction requires manual payment verification for the",
      };
    default:
      return {
        preview: `Transaction update`,
        heading: "Transaction Update",
        statusBoxStyle: styles.successBox,
        statusMessageStyle: styles.successMessage,
        statusTitle: "Transaction Status:",
        statusMessage: "Processed",
        mainText: "A transaction has been processed for the",
      };
  }
};

export const AdminTransactionNotification = ({
  adminName = "Admin",
  userName,
  userEmail,
  tokenName,
  tokenSymbol,
  purchaseAmount,
  tokenAmount,
  transactionHash,
  transactionTime,
  paymentMethod,
  walletAddress,
  transactionId,
  dashboardUrl = "#",
  transactionUrl = "#",
  supportEmail = "support@company.com",
  paidCurrency,
  status,
}: AdminTransactionNotificationProps) => {
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
            <Text style={styles.greeting}>Hello {adminName},</Text>

            <Text style={styles.paragraph}>
              {statusConfig.mainText}{" "}
              <strong>
                {tokenName} ({tokenSymbol})
              </strong>{" "}
              ICO sale.
            </Text>

            <Section style={statusConfig.statusBoxStyle}>
              <Text style={styles.successTitle}>{statusConfig.statusTitle}</Text>
              <Text style={statusConfig.statusMessageStyle}>
                {statusConfig.statusMessage}
              </Text>
            </Section>

            <Hr style={styles.divider} />

            <Section style={styles.detailsSection}>
              <Heading style={styles.h2}>Transaction Details</Heading>

              <Text style={styles.detailItem}>
                <strong>Customer:</strong> {userName} ({userEmail})
              </Text>

              <Text style={styles.detailItem}>
                <strong>Purchase Amount:</strong> {purchaseAmount} {paidCurrency}
              </Text>

              <Text style={styles.detailItem}>
                <strong>Tokens Allocated:</strong> {tokenAmount} {tokenSymbol}
              </Text>

              <Text style={styles.detailItem}>
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>

              <Text style={styles.detailItem}>
                <strong>Wallet Address:</strong> {walletAddress}
              </Text>

              <Text style={styles.detailItem}>
                <strong>Transaction Time:</strong> {transactionTime}
              </Text>
            </Section>

            <Section style={styles.transactionBox}>
              {paymentMethod === "CRYPTO" ? (
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

            {status === "RECONCILIATION_PENDING" && (
              <Section style={styles.actionSection}>
                <Text style={styles.paragraph}>
                  <strong>⚠️ Manual Verification Required</strong>
                </Text>
                <Text style={styles.paragraph}>
                  This transaction requires your immediate attention to verify and
                  reconcile the payment. Please review the transaction details and
                  confirm the payment has been received.
                </Text>

                <Button style={styles.button} href={dashboardUrl}>
                  Verify Payment Now
                </Button>
              </Section>
            )}

            {status !== "RECONCILIATION_PENDING" && (
              <Section style={styles.actionSection}>
                <Text style={styles.paragraph}>
                  Review the transaction details and monitor the sale progress in
                  your admin dashboard.
                </Text>

                <Button style={styles.button} href={dashboardUrl}>
                  View Admin Dashboard
                </Button>
              </Section>
            )}

            <Section style={styles.nextStepsSection}>
              <Heading style={styles.h3}>Admin Actions:</Heading>
              {status === "RECONCILIATION_PENDING" && (
                <>
                  <Text style={styles.listItem}>
                    • <strong>Verify payment has been received</strong> - Check
                    bank account or payment processor
                  </Text>
                  <Text style={styles.listItem}>
                    • <strong>Confirm transaction details</strong> - Verify amount,
                    customer, and payment method match
                  </Text>
                  <Text style={styles.listItem}>
                    • <strong>Reconcile payment</strong> - Mark transaction as
                    confirmed once verified
                  </Text>
                  <Text style={styles.listItem}>
                    • <strong>Update transaction status</strong> - Move to
                    CONFIRMED status after verification
                  </Text>
                </>
              )}
              {status === "AWAITING_PAYMENT" && (
                <>
                  <Text style={styles.listItem}>
                    • Transaction has been automatically processed
                  </Text>
                  <Text style={styles.listItem}>
                    • Payment is being verified automatically
                  </Text>
                  <Text style={styles.listItem}>
                    • Customer confirmation email has been sent
                  </Text>
                  <Text style={styles.listItem}>
                    • Sale metrics have been updated
                  </Text>
                </>
              )}
              {status === "CONFIRMED" && (
                <>
                  <Text style={styles.listItem}>
                    • Transaction has been automatically processed
                  </Text>
                  <Text style={styles.listItem}>
                    • Payment has been confirmed and verified
                  </Text>
                  <Text style={styles.listItem}>
                    • Customer confirmation email has been sent
                  </Text>
                  <Text style={styles.listItem}>
                    • Sale metrics have been updated
                  </Text>
                </>
              )}
            </Section>

            <Hr style={styles.divider} />

            <Text style={styles.footer}>
              For any questions or issues, contact support at{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.link}>
                {supportEmail}
              </Link>
            </Text>

            <Text style={styles.signature}>
              Best regards,
              <br />
              ICO Platform System
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

AdminTransactionNotification.PreviewProps = {
  adminName: "Admin User",
  userName: "John Doe",
  userEmail: "john.doe@example.com",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  purchaseAmount: "1,000 USDC",
  tokenAmount: "10,000",
  transactionHash:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  transactionTime: "2024-01-15 14:30:00 UTC",
  paymentMethod: "TRANSFER",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  dashboardUrl: "https://admin.example.com",
  transactionId: "1234567890",
  transactionUrl:
    "https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  supportEmail: "support@example.com",
  paidCurrency: "USDC",
  status: "RECONCILIATION_PENDING",
} satisfies AdminTransactionNotificationProps;

export default AdminTransactionNotification;
