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

export interface PaymentReminderProps {
  userName: string;
  tokenName: string;
  tokenSymbol: string;
  purchaseAmount: string;
  paidCurrency: string;
  transactionId: string;
  paymentDeadline?: string;
  paymentInstructions?: string;
  paymentUrl?: string;
  dashboardUrl?: string;
  supportEmail?: string;
}

export const PaymentReminderEmail = ({
  userName,
  tokenName,
  tokenSymbol,
  purchaseAmount,
  paidCurrency,
  transactionId,
  paymentDeadline,
  paymentInstructions,
  paymentUrl = "#",
  dashboardUrl = "#",
  supportEmail = "support@company.com",
}: PaymentReminderProps) => (
  <Html>
    <Head />
    <Preview>
      Payment Reminder - Complete your {tokenName} purchase to secure your
      tokens
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>⏰ Payment Reminder</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            This is a friendly reminder that your purchase of{" "}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{" "}
            tokens is pending payment completion.
          </Text>

          <Section style={styles.awaitingPaymentBox}>
            <Text style={styles.successTitle}>Transaction Status:</Text>
            <Text style={styles.awaitingPaymentMessage}>
              ⏳ Awaiting Payment
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Transaction Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Token:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>Purchase Amount:</strong> {purchaseAmount}{" "}
              {paidCurrency}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Transaction ID:</strong> {transactionId}
            </Text>

            {paymentDeadline && (
              <Text style={styles.detailItem}>
                <strong>Payment Deadline:</strong> {paymentDeadline}
              </Text>
            )}
          </Section>

          {paymentInstructions && (
            <Section style={styles.nextStepsSection}>
              <Heading style={styles.h3}>Payment Instructions</Heading>
              <Text style={styles.paragraph}>{paymentInstructions}</Text>
            </Section>
          )}

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Complete Your Payment</Heading>
            <Text style={styles.listItem}>
              • Click the button below to view payment details
            </Text>
            <Text style={styles.listItem}>
              • Follow the payment instructions provided
            </Text>
            {paymentDeadline && (
              <Text style={styles.listItem}>
                • Complete payment before {paymentDeadline} to secure your
                tokens
              </Text>
            )}
            <Text style={styles.listItem}>
              • You'll receive a confirmation email once payment is received
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Complete your payment now to secure your token allocation:
            </Text>

            <Button style={styles.button} href={paymentUrl}>
              Complete Payment
            </Button>
          </Section>

          <Section style={styles.actionSection}>
            <Link href={dashboardUrl} style={styles.link}>
              View Transaction Details →
            </Link>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>Need Help?</Heading>
            <Text style={styles.paragraph}>
              If you're experiencing issues with payment or have questions,
              we're here to help:
            </Text>
            <Text style={styles.listItem}>
              • Check your payment method is valid and has sufficient funds
            </Text>
            <Text style={styles.listItem}>
              • Review the payment instructions in your dashboard
            </Text>
            <Text style={styles.listItem}>
              • Contact our support team for assistance
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any questions or need assistance with your payment,
            please contact us at{" "}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>

          <Text style={styles.signature}>
            We look forward to completing your purchase!
            <br />
            The {tokenName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

PaymentReminderEmail.PreviewProps = {
  userName: "John Doe",
  tokenName: "MyToken",
  tokenSymbol: "MTK",
  purchaseAmount: "1,000",
  paidCurrency: "USDC",
  transactionId: "TX-1234567890",
  paymentDeadline: "2024-01-20 23:59:59 UTC",
  paymentInstructions:
    "Please send the payment to the wallet address provided in your transaction details. Include the transaction ID in the memo field.",
  paymentUrl: "https://dashboard.example.com/transactions/TX-1234567890/pay",
  dashboardUrl: "https://dashboard.example.com/transactions",
  supportEmail: "support@example.com",
} satisfies PaymentReminderProps;

export default PaymentReminderEmail;

