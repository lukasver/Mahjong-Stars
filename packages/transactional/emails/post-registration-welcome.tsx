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

interface PostRegistrationWelcomeProps {
  userName: string;
  dashboardUrl?: string;
  supportEmail?: string;
  companyName?: string;
}

export const PostRegistrationWelcomeEmail = ({
  userName,
  dashboardUrl = "#",
  supportEmail = "support@company.com",
  companyName = "Token Platform",
}: PostRegistrationWelcomeProps) => (
  <Html>
    <Head />
    <Preview>
      Welcome to {companyName}! Your account is ready. Complete your profile to
      start investing.
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>🎉 Welcome to {companyName}!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Thank you for joining {companyName}! Your email has been verified
            and your account is now active. We're excited to have you as part of
            our community.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Account Status:</Text>
            <Text style={styles.successMessage}>✅ Verified & Ready</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h2}>Get Started</Heading>

            <Text style={styles.listItem}>
              <strong>Purchase Tokens on Active Sales</strong>
              <br />
              Browse our active token sales and start building your investment
              portfolio. Connect your wallet and begin purchasing tokens today.
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Button style={styles.button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What You Can Do Now</Heading>
            <Text style={styles.listItem}>
              • Browse active token sales and explore investment opportunities
            </Text>
            <Text style={styles.listItem}>
              • Connect your wallet and purchase tokens on available sales
            </Text>
            <Text style={styles.listItem}>
              • Access your personal dashboard to track your investments
            </Text>
            <Text style={styles.listItem}>
              • Join our community channels for updates and support
            </Text>
          </Section>


          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any questions or need assistance, our support team is
            here to help. Contact us at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Welcome aboard!
            <br />
            The {companyName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

PostRegistrationWelcomeEmail.PreviewProps = {
  userName: "John Doe",
  dashboardUrl: "https://dashboard.example.com",
  supportEmail: "support@example.com",
  companyName: "MyToken Platform",
} satisfies PostRegistrationWelcomeProps;

export default PostRegistrationWelcomeEmail;

