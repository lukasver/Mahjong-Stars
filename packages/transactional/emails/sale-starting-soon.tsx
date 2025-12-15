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

interface SaleStartingSoonProps {
  userName?: string;
  tokenName: string;
  tokenSymbol: string;
  saleStartTime: string;
  tokenPrice?: string;
  minPurchase?: string;
  maxPurchase?: string;
  totalTokens?: string;
  saleUrl?: string;
  kycRequired?: boolean;
  calendarUrl?: string;
  supportEmail?: string;
}

export const SaleStartingSoonEmail = ({
  userName = "User",
  tokenName,
  tokenSymbol,
  saleStartTime,
  tokenPrice,
  minPurchase,
  maxPurchase,
  totalTokens,
  saleUrl = "#",
  kycRequired = false,
  calendarUrl,
  supportEmail = "support@company.com",
}: SaleStartingSoonProps) => (
  <Html>
    <Head />
    <Preview>
      {tokenName} ({tokenSymbol}) Sale Starting Soon - Get Ready!
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>🚀 Sale Starting Soon!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Exciting news! The token sale for{" "}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{" "}
            is starting soon. Don't miss this opportunity to be part of the
            early investor community!
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Sale Status:</Text>
            <Text style={styles.successMessage}>
              ⏰ Starting {saleStartTime}
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Sale Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Token:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>Start Time:</strong> {saleStartTime}
            </Text>

            {tokenPrice && (
              <Text style={styles.detailItem}>
                <strong>Token Price:</strong> {tokenPrice}
              </Text>
            )}

            {minPurchase && (
              <Text style={styles.detailItem}>
                <strong>Minimum Purchase:</strong> {minPurchase}
              </Text>
            )}

            {maxPurchase && (
              <Text style={styles.detailItem}>
                <strong>Maximum Purchase:</strong> {maxPurchase}
              </Text>
            )}

            {totalTokens && (
              <Text style={styles.detailItem}>
                <strong>Total Tokens Available:</strong> {totalTokens}
              </Text>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Prepare for the Sale</Heading>
            <Text style={styles.listItem}>
              {kycRequired
                ? "• Complete your KYC verification (required)"
                : "• Ensure your KYC is up to date"}
            </Text>
            <Text style={styles.listItem}>
              • Connect and verify your wallet is ready
            </Text>
            <Text style={styles.listItem}>
              • Review the token whitepaper and sale terms
            </Text>
            <Text style={styles.listItem}>
              • Have your payment method ready
            </Text>
            {calendarUrl && (
              <Text style={styles.listItem}>
                • Add the sale to your calendar so you don't miss it
              </Text>
            )}
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Get ready! Click below to view sale details and set a reminder:
            </Text>

            <Button style={styles.button} href={saleUrl}>
              View Sale Details
            </Button>
          </Section>

          {calendarUrl && (
            <Section style={styles.actionSection}>
              <Link href={calendarUrl} style={styles.link}>
                📅 Add to Calendar
              </Link>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Why Participate?</Heading>
            <Text style={styles.listItem}>
              • Early access to tokens at sale price
            </Text>
            <Text style={styles.listItem}>
              • Potential for significant returns as the project grows
            </Text>
            <Text style={styles.listItem}>
              • Join an exclusive community of early supporters
            </Text>
            <Text style={styles.listItem}>
              • Support innovative projects from the ground up
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any questions about the sale or need assistance, please
            contact our support team at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            See you at the sale!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

SaleStartingSoonEmail.PreviewProps = {
  userName: "John Doe",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  saleStartTime: "January 20, 2024 at 12:00 PM UTC",
  tokenPrice: "0.10 USDC",
  minPurchase: "100 USDC",
  maxPurchase: "10,000 USDC",
  totalTokens: "10,000,000 MTK",
  saleUrl: "https://dashboard.example.com/sales/mytoken",
  kycRequired: true,
  calendarUrl: "https://calendar.example.com/add?event=sale-start",
  supportEmail: "support@example.com",
} satisfies SaleStartingSoonProps;

export default SaleStartingSoonEmail;

