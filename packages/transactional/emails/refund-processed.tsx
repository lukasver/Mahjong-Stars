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

export interface RefundProcessedProps {
  userName: string;
  refundAmount: string;
  refundCurrency: string;
  transactionId: string;
  refundMethod: string;
  refundTimeline?: string;
  refundReason?: string;
  dashboardUrl?: string;
  supportEmail?: string;
  tokenName?: string;
}

export const RefundProcessedEmail = ({
  userName,
  refundAmount,
  refundCurrency,
  transactionId,
  refundMethod,
  refundTimeline = "5-10 business days",
  refundReason,
  dashboardUrl = "#",
  supportEmail = "support@company.com",
  tokenName = "Token Platform",
}: RefundProcessedProps) => (
  <Html>
    <Head />
    <Preview>
      Refund Processed - Your refund of {refundAmount} {refundCurrency} is being
      processed
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>💰 Refund Processed</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            We're writing to confirm that your refund request has been processed
            for transaction {transactionId}. Your refund is now being processed
            and will be returned to you according to the timeline below.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Refund Status:</Text>
            <Text style={styles.successMessage}>✅ Processing</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Refund Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Refund Amount:</strong> {refundAmount} {refundCurrency}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Refund Method:</strong> {refundMethod}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Transaction ID:</strong> {transactionId}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Expected Timeline:</strong> {refundTimeline}
            </Text>

            {refundReason && (
              <Text style={styles.detailItem}>
                <strong>Reason:</strong> {refundReason}
              </Text>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What Happens Next</Heading>
            <Text style={styles.listItem}>
              • Your refund has been initiated and is being processed
            </Text>
            <Text style={styles.listItem}>
              • The funds will be returned to your original payment method
            </Text>
            <Text style={styles.listItem}>
              • You'll receive a confirmation once the refund is completed
            </Text>
            <Text style={styles.listItem}>
              • Processing typically takes {refundTimeline}
            </Text>
            <Text style={styles.listItem}>
              • You can track the status in your dashboard
            </Text>
          </Section>

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Important Notes</Heading>
            <Text style={styles.listItem}>
              • Refunds are processed to the original payment method used
            </Text>
            <Text style={styles.listItem}>
              • If your payment method has changed, please contact support
            </Text>
            <Text style={styles.listItem}>
              • Bank transfers may take longer than card refunds
            </Text>
            <Text style={styles.listItem}>
              • You'll receive an email confirmation when the refund completes
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              View your transaction history and refund status in your dashboard:
            </Text>

            <Button style={styles.button} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any questions about your refund or if you don't receive
            the funds within the expected timeline, please contact our support
            team at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            Thank you for your understanding.
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

RefundProcessedEmail.PreviewProps = {
  userName: "John Doe",
  refundAmount: "1,000",
  refundCurrency: "USDC",
  transactionId: "TX-1234567890",
  refundMethod: "Original Payment Method",
  refundTimeline: "5-10 business days",
  refundReason: "Transaction cancelled per user request",
  dashboardUrl: "https://dashboard.example.com",
  supportEmail: "support@example.com",
  tokenName: "MyToken Platform",
} satisfies RefundProcessedProps;

export default RefundProcessedEmail;

