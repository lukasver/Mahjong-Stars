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

interface KycVerifiedProps {
  userName: string;
  kycTier?: string;
  purchaseLimit?: string;
  dashboardUrl?: string;
  salesUrl?: string;
  supportEmail?: string;
  tokenName?: string;
}

export const KycVerifiedEmail = ({
  userName,
  kycTier = "Standard",
  purchaseLimit,
  dashboardUrl = "#",
  salesUrl = "#",
  supportEmail = "support@company.com",
  tokenName = "Token Platform",
}: KycVerifiedProps) => (
  <Html>
    <Head />
    <Preview>
      🎉 KYC Verification Successful! You're now ready to start investing.
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>✅ KYC Verification Complete!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Congratulations {userName}!</Text>

          <Text style={styles.paragraph}>
            Great news! Your Know Your Customer (KYC) verification has been
            successfully completed and approved. You're now fully verified and
            ready to participate in token sales on {tokenName}.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Verification Status:</Text>
            <Text style={styles.successMessage}>
              ✅ Verified - {kycTier} Tier
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>What's Unlocked</Heading>

            <Text style={styles.detailItem}>
              <strong>Verification Tier:</strong> {kycTier}
            </Text>

            {purchaseLimit && (
              <Text style={styles.detailItem}>
                <strong>Purchase Limit:</strong> {purchaseLimit}
              </Text>
            )}

            <Text style={styles.detailItem}>
              <strong>Access:</strong> All available token sales
            </Text>

            <Text style={styles.detailItem}>
              <strong>Status:</strong> Ready to invest
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Next Steps</Heading>
            <Text style={styles.listItem}>
              • Browse available token sales and investment opportunities
            </Text>
            <Text style={styles.listItem}>
              • Connect your wallet to start making purchases
            </Text>
            <Text style={styles.listItem}>
              • Review sale terms and tokenomics before investing
            </Text>
            <Text style={styles.listItem}>
              • Monitor your investments from your dashboard
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Ready to start investing? Explore our available sales:
            </Text>

            <Button style={styles.button} href={salesUrl}>
              View Available Sales
            </Button>
          </Section>

          <Section style={styles.actionSection}>
            <Button style={styles.button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            Thank you for completing the verification process! If you have any
            questions, please contact us at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Happy investing!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

KycVerifiedEmail.PreviewProps = {
  userName: "John Doe",
  kycTier: "Enhanced",
  purchaseLimit: "Up to $50,000 per transaction",
  dashboardUrl: "https://dashboard.example.com",
  salesUrl: "https://dashboard.example.com/sales",
  supportEmail: "support@example.com",
  tokenName: "MyToken Platform",
} satisfies KycVerifiedProps;

export default KycVerifiedEmail;

