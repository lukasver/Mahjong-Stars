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

export interface TokensDistributedProps {
  userName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAmount: string;
  walletAddress: string;
  transactionHash?: string;
  transactionUrl?: string;
  distributionDate: string;
  vestingSchedule?: string;
  dashboardUrl?: string;
  supportEmail?: string;
}

export const TokensDistributedEmail = ({
  userName,
  tokenName,
  tokenSymbol,
  tokenAmount,
  walletAddress,
  transactionHash,
  transactionUrl,
  distributionDate,
  vestingSchedule,
  dashboardUrl = "#",
  supportEmail = "support@company.com",
}: TokensDistributedProps) => (
  <Html>
    <Head />
    <Preview>
      🎉 Your {tokenAmount} {tokenSymbol} tokens have been distributed to your
      wallet!
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>🎉 Tokens Distributed!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Excellent news! Your {tokenName} ({tokenSymbol}) tokens have been
            successfully distributed to your wallet. Your investment is now
            complete and your tokens are ready to use.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Distribution Status:</Text>
            <Text style={styles.successMessage}>
              ✅ Tokens Successfully Distributed
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Distribution Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Token Name:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>Amount Distributed:</strong> {tokenAmount} {tokenSymbol}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Wallet Address:</strong> {walletAddress}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Distribution Date:</strong> {distributionDate}
            </Text>

            {vestingSchedule && (
              <Text style={styles.detailItem}>
                <strong>Vesting Schedule:</strong> {vestingSchedule}
              </Text>
            )}
          </Section>

          {transactionHash && (
            <Section style={styles.transactionBox}>
              <Text style={styles.h3}>Transaction Hash:</Text>
              <Text style={styles.transactionHash}>{transactionHash}</Text>
              {transactionUrl && (
                <Link href={transactionUrl} style={styles.link}>
                  View on Blockchain Explorer →
                </Link>
              )}
            </Section>
          )}

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What You Can Do Now</Heading>
            <Text style={styles.listItem}>
              • Check your wallet to confirm token receipt
            </Text>
            <Text style={styles.listItem}>
              • View your transaction on the blockchain explorer
            </Text>
            {vestingSchedule && (
              <Text style={styles.listItem}>
                • Review your vesting schedule in your dashboard
              </Text>
            )}
            <Text style={styles.listItem}>
              • Monitor your token balance and portfolio value
            </Text>
            <Text style={styles.listItem}>
              • Stay updated on project milestones and announcements
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              View your complete transaction history and portfolio in your
              dashboard:
            </Text>

            <Button style={styles.button} href={dashboardUrl}>
              View My Dashboard
            </Button>
          </Section>

          {vestingSchedule && (
            <Section style={styles.nextStepsSection}>
              <Heading style={styles.h3}>Vesting Information</Heading>
              <Text style={styles.paragraph}>
                Your tokens are subject to a vesting schedule. Please review the
                details in your dashboard to understand when additional tokens
                will become available.
              </Text>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            Thank you for your investment! If you have any questions about your
            token distribution, please contact us at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Congratulations on your investment!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

TokensDistributedEmail.PreviewProps = {
  userName: "John Doe",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  tokenAmount: "10,000",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  transactionHash:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  transactionUrl:
    "https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  distributionDate: "2024-01-15 14:30:00 UTC",
  vestingSchedule: "6-month cliff, 24-month linear vesting",
  dashboardUrl: "https://dashboard.example.com",
  supportEmail: "support@example.com",
} satisfies TokensDistributedProps;

export default TokensDistributedEmail;

