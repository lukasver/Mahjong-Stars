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

interface AdminTransactionNotificationProps {
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
}

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
}: {
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
}) => (
  <Html>
    <Head />
    <Preview>
      New ICO transaction confirmed: {userName} purchased {tokenAmount}{" "}
      {tokenSymbol}
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>💰 New Transaction Confirmed</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {adminName},</Text>

          <Text style={styles.paragraph}>
            A new transaction has been successfully confirmed for the{" "}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{" "}
            ICO sale.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Transaction Status:</Text>
            <Text style={styles.successMessage}>✅ Confirmed & Processed</Text>
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

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Review the transaction details and monitor the sale progress in
              your admin dashboard.
            </Text>

            <Button style={styles.button} href={dashboardUrl}>
              View Admin Dashboard
            </Button>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Admin Actions:</Heading>
            <Text style={styles.listItem}>
              • Transaction has been automatically processed
            </Text>
            <Text style={styles.listItem}>
              • Customer confirmation email has been sent
            </Text>
            <Text style={styles.listItem}>
              • Sale metrics have been updated
            </Text>
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
} satisfies AdminTransactionNotificationProps;

export default AdminTransactionNotification;
