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

interface SecurityAlertProps {
  userName: string;
  alertType: "login" | "email_change" | "password_change" | "device_change" | "other";
  eventDescription: string;
  eventTime: string;
  eventLocation?: string;
  deviceInfo?: string;
  ipAddress?: string;
  actionUrl?: string;
  supportEmail?: string;
  tokenName?: string;
}

const getAlertTitle = (alertType: string): string => {
  switch (alertType) {
    case "login":
      return "🔐 New Login Detected";
    case "email_change":
      return "📧 Email Address Changed";
    case "password_change":
      return "🔑 Password Changed";
    case "device_change":
      return "📱 New Device Detected";
    default:
      return "⚠️ Security Alert";
  }
};

export const SecurityAlertEmail = ({
  userName,
  alertType,
  eventDescription,
  eventTime,
  eventLocation,
  deviceInfo,
  ipAddress,
  actionUrl = "#",
  supportEmail = "support@company.com",
  tokenName = "Token Platform",
}: SecurityAlertProps) => (
  <Html>
    <Head />
    <Preview>
      Security Alert - {eventDescription} on your {tokenName} account
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>{getAlertTitle(alertType)}</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            We're writing to inform you of a recent security event on your{" "}
            {tokenName} account. This is an automated security notification to
            keep you informed about account activity.
          </Text>

          <Section style={styles.alertBox}>
            <Text style={styles.alertTitle}>Security Event:</Text>
            <Text style={styles.alertReason}>{eventDescription}</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Event Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Event Type:</strong> {alertType.replace("_", " ")}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Time:</strong> {eventTime}
            </Text>

            {eventLocation && (
              <Text style={styles.detailItem}>
                <strong>Location:</strong> {eventLocation}
              </Text>
            )}

            {deviceInfo && (
              <Text style={styles.detailItem}>
                <strong>Device:</strong> {deviceInfo}
              </Text>
            )}

            {ipAddress && (
              <Text style={styles.detailItem}>
                <strong>IP Address:</strong> {ipAddress}
              </Text>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Was This You?</Heading>
            <Text style={styles.listItem}>
              ✅ If this was you, no action is required. You can safely ignore
              this email.
            </Text>
            <Text style={styles.listItem}>
              ⚠️ If this was NOT you, please take immediate action to secure
              your account.
            </Text>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>If This Wasn't You</Heading>
            <Text style={styles.listItem}>
              • Change your password immediately
            </Text>
            <Text style={styles.listItem}>
              • Review your account activity and recent transactions
            </Text>
            <Text style={styles.listItem}>
              • Enable two-factor authentication if available
            </Text>
            <Text style={styles.listItem}>
              • Contact our support team immediately
            </Text>
            <Text style={styles.listItem}>
              • Review and revoke any suspicious sessions
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Review your account security settings:
            </Text>

            <Button style={styles.button} href={actionUrl}>
              Review Account Security
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Security Best Practices</Heading>
            <Text style={styles.listItem}>
              • Use a strong, unique password for your account
            </Text>
            <Text style={styles.listItem}>
              • Enable two-factor authentication when available
            </Text>
            <Text style={styles.listItem}>
              • Never share your login credentials with anyone
            </Text>
            <Text style={styles.listItem}>
              • Log out from shared or public devices
            </Text>
            <Text style={styles.listItem}>
              • Regularly review your account activity
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any concerns about your account security or believe
            someone has unauthorized access, please contact our security team
            immediately at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Stay secure,
            <br />
            The {tokenName} Security Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

SecurityAlertEmail.PreviewProps = {
  userName: "John Doe",
  alertType: "login",
  eventDescription: "New login from Chrome on Windows",
  eventTime: "2024-01-15 14:30:00 UTC",
  eventLocation: "New York, United States",
  deviceInfo: "Chrome on Windows 11",
  ipAddress: "192.168.1.1",
  actionUrl: "https://dashboard.example.com/security",
  supportEmail: "support@example.com",
  tokenName: "MyToken Platform",
} satisfies SecurityAlertProps;

export default SecurityAlertEmail;

