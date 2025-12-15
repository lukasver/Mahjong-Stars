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

interface SaleClosingSoonProps {
  userName?: string;
  tokenName: string;
  tokenSymbol: string;
  saleEndTime: string;
  tokensRemaining?: string;
  progressPercentage?: string;
  totalRaised?: string;
  saleUrl?: string;
  supportEmail?: string;
}

export const SaleClosingSoonEmail = ({
  userName = "User",
  tokenName,
  tokenSymbol,
  saleEndTime,
  tokensRemaining,
  progressPercentage,
  totalRaised,
  saleUrl = "#",
  supportEmail = "support@company.com",
}: SaleClosingSoonProps) => (
  <Html>
    <Head />
    <Preview>
      ⏰ {tokenName} Sale Closing Soon - Don't Miss Out!
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>⏰ Sale Closing Soon!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Time is running out! The token sale for{" "}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{" "}
            is closing soon. If you've been considering participating, now is
            the time to act!
          </Text>

          <Section style={styles.awaitingPaymentBox}>
            <Text style={styles.successTitle}>Sale Status:</Text>
            <Text style={styles.awaitingPaymentMessage}>
              ⏰ Closing {saleEndTime}
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Sale Progress</Heading>

            <Text style={styles.detailItem}>
              <strong>Token:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>Closing Time:</strong> {saleEndTime}
            </Text>

            {progressPercentage && (
              <Text style={styles.detailItem}>
                <strong>Progress:</strong> {progressPercentage}% sold
              </Text>
            )}

            {totalRaised && (
              <Text style={styles.detailItem}>
                <strong>Total Raised:</strong> {totalRaised}
              </Text>
            )}

            {tokensRemaining && (
              <Text style={styles.detailItem}>
                <strong>Tokens Remaining:</strong> {tokensRemaining}
              </Text>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Act Now</Heading>
            <Text style={styles.listItem}>
              • Limited time remaining to participate in this sale
            </Text>
            {tokensRemaining && (
              <Text style={styles.listItem}>
                • Only {tokensRemaining} tokens remaining
              </Text>
            )}
            <Text style={styles.listItem}>
              • Complete your purchase before the sale closes
            </Text>
            <Text style={styles.listItem}>
              • Secure your token allocation at the sale price
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Don't miss out! Participate in the sale now:
            </Text>

            <Button style={styles.button} href={saleUrl}>
              Participate Now
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What Happens After the Sale</Heading>
            <Text style={styles.listItem}>
              • Sale will close at {saleEndTime}
            </Text>
            <Text style={styles.listItem}>
              • Token distribution will begin after sale completion
            </Text>
            <Text style={styles.listItem}>
              • You'll receive updates on distribution timeline
            </Text>
            <Text style={styles.listItem}>
              • Tokens will be distributed to your registered wallet
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any questions or need assistance, please contact our
            support team at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Don't miss this opportunity!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

SaleClosingSoonEmail.PreviewProps = {
  userName: "John Doe",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  saleEndTime: "January 25, 2024 at 11:59 PM UTC",
  tokensRemaining: "2,500,000 MTK",
  progressPercentage: "75",
  totalRaised: "750,000 USDC",
  saleUrl: "https://dashboard.example.com/sales/mytoken",
  supportEmail: "support@example.com",
} satisfies SaleClosingSoonProps;

export default SaleClosingSoonEmail;

