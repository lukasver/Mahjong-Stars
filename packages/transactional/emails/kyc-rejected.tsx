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

export interface KycRejectedProps {
  userName: string;
  rejectionReason?: string;
  resubmitUrl?: string;
  supportEmail?: string;
  tokenName?: string;
}

export const KycRejectedEmail = ({
  userName,
  rejectionReason,
  resubmitUrl = "#",
  supportEmail = "support@company.com",
  tokenName = "Token Platform",
}: KycRejectedProps) => (
  <Html>
    <Head />
    <Preview>
      KYC Verification Update - Action Required to Resubmit Your Application
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>⚠️ KYC Verification Update</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            We regret to inform you that your Know Your Customer (KYC)
            verification application for {tokenName} could not be approved at
            this time.
          </Text>

          <Section style={styles.errorBox}>
            <Text style={styles.errorTitle}>Verification Status:</Text>
            <Text style={styles.errorMessage}>❌ Rejected</Text>
          </Section>

          <Hr style={styles.divider} />

          {rejectionReason && (
            <Section style={styles.reasonSection}>
              <Heading style={styles.h3}>Reason for Rejection:</Heading>
              <Text style={styles.paragraph}>{rejectionReason}</Text>
            </Section>
          )}

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What You Can Do</Heading>
            <Text style={styles.listItem}>
              <strong>1. Review the Rejection Reason</strong>
              <br />
              Please review the reason provided above to understand what needs to
              be corrected.
            </Text>

            <Text style={styles.listItem}>
              <strong>2. Gather Required Documents</strong>
              <br />
              Ensure you have all required documents ready and that they are
              clear, valid, and match the information provided.
            </Text>

            <Text style={styles.listItem}>
              <strong>3. Resubmit Your Application</strong>
              <br />
              Once you've addressed the issues, you can resubmit your KYC
              verification application.
            </Text>

            <Text style={styles.listItem}>
              <strong>4. Contact Support</strong>
              <br />
              If you have questions or believe this rejection is incorrect, our
              support team is here to help.
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Ready to resubmit? Click the button below to start a new KYC
              verification:
            </Text>

            <Button style={styles.button} href={resubmitUrl}>
              Resubmit KYC Application
            </Button>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Common Issues to Check</Heading>
            <Text style={styles.listItem}>
              • Documents are clear and legible (not blurry or cropped)
            </Text>
            <Text style={styles.listItem}>
              • All information matches exactly (name, date of birth, address)
            </Text>
            <Text style={styles.listItem}>
              • Documents are not expired and are government-issued
            </Text>
            <Text style={styles.listItem}>
              • Photos are in color and show your full face clearly
            </Text>
            <Text style={styles.listItem}>
              • All required fields are completed accurately
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            We're here to help you complete the verification process
            successfully. If you have any questions or need assistance, please
            don't hesitate to contact our support team at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Best regards,
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

KycRejectedEmail.PreviewProps = {
  userName: "John Doe",
  rejectionReason:
    "The provided identification document could not be verified. Please ensure your document is clear, valid, and matches the information provided in your application.",
  resubmitUrl: "https://dashboard.example.com/kyc/resubmit",
  supportEmail: "support@example.com",
  tokenName: "MyToken Platform",
} satisfies KycRejectedProps;

export default KycRejectedEmail;

