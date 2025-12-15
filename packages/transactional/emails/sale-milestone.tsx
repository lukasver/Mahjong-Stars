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

export interface SaleMilestoneProps {
  userName?: string;
  tokenName: string;
  tokenSymbol: string;
  milestone: string;
  progressPercentage: string;
  totalRaised?: string;
  tokensSold?: string;
  tokensRemaining?: string;
  saleUrl?: string;
  shareUrl?: string;
  supportEmail?: string;
}

export const SaleMilestoneEmail = ({
  userName = "User",
  tokenName,
  tokenSymbol,
  milestone,
  progressPercentage,
  totalRaised,
  tokensSold,
  tokensRemaining,
  saleUrl = "#",
  shareUrl,
  supportEmail = "support@company.com",
}: SaleMilestoneProps) => (
  <Html>
    <Head />
    <Preview>
      🎉 {tokenName} Sale Milestone Achieved - {milestone} Complete!
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>🎉 Milestone Achieved!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Exciting news! The {tokenName} ({tokenSymbol}) token sale has
            reached a major milestone. We're thrilled to share this achievement
            with our community!
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Milestone:</Text>
            <Text style={styles.successMessage}>
              🎯 {milestone} Complete!
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Sale Progress</Heading>

            <Text style={styles.detailItem}>
              <strong>Token:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>Progress:</strong> {progressPercentage}% complete
            </Text>

            {totalRaised && (
              <Text style={styles.detailItem}>
                <strong>Total Raised:</strong> {totalRaised}
              </Text>
            )}

            {tokensSold && (
              <Text style={styles.detailItem}>
                <strong>Tokens Sold:</strong> {tokensSold}
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
            <Heading style={styles.h3}>What This Means</Heading>
            <Text style={styles.listItem}>
              • Strong community support and investor confidence
            </Text>
            <Text style={styles.listItem}>
              • Significant progress toward our funding goals
            </Text>
            <Text style={styles.listItem}>
              • Growing momentum in the token sale
            </Text>
            <Text style={styles.listItem}>
              • Limited time remaining to join at sale price
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Join the growing community of investors:
            </Text>

            <Button style={styles.button} href={saleUrl}>
              Participate in Sale
            </Button>
          </Section>

          {shareUrl && (
            <Section style={styles.actionSection}>
              <Text style={styles.paragraph}>
                Help us spread the word! Share this milestone:
              </Text>
              <Link href={shareUrl} style={styles.link}>
                Share on Social Media →
              </Link>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Thank You</Heading>
            <Text style={styles.paragraph}>
              This milestone wouldn't be possible without the support of our
              community. Thank you to all investors who have participated so
              far!
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            Stay updated on sale progress and upcoming milestones. If you have
            any questions, contact us at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Together we're building something amazing!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

SaleMilestoneEmail.PreviewProps = {
  userName: "John Doe",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  milestone: "50%",
  progressPercentage: "50",
  totalRaised: "500,000 USDC",
  tokensSold: "5,000,000 MTK",
  tokensRemaining: "5,000,000 MTK",
  saleUrl: "https://dashboard.example.com/sales/mytoken",
  shareUrl: "https://twitter.com/intent/tweet?text=Check%20out%20this%20milestone",
  supportEmail: "support@example.com",
} satisfies SaleMilestoneProps;

export default SaleMilestoneEmail;

