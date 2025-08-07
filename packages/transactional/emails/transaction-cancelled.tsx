import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from '@react-email/components';
import * as styles from './shared-styles';

export interface TransactionCancelledProps {
  userName: string;
  saleName: string;
  transactionId: string;
  quantity: string;
  tokenSymbol: string;
  reason: string;
  supportEmail?: string;
}

export const TransactionCancelledEmail = ({
  userName,
  saleName,
  transactionId,
  quantity,
  tokenSymbol,
  reason,
  supportEmail = 'hello@mahjonstars.com',
}: {
  userName: string;
  saleName: string;
  transactionId: string;
  quantity: string;
  tokenSymbol: string;
  reason: string;
  supportEmail?: string;
}) => (
  <Html>
    <Head />
    <Preview>Transaction cancelled - Your purchase has been cancelled</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>❌ Transaction Cancelled</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            We regret to inform you that your transaction for{' '}
            <strong>
              {quantity} {tokenSymbol}
            </strong>{' '}
            tokens from the <strong>{saleName}</strong> sale has been cancelled.
          </Text>

          <Section style={styles.errorBox}>
            <Text style={styles.errorTitle}>Transaction Status:</Text>
            <Text style={styles.errorMessage}>❌ Cancelled</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Transaction Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Sale Name:</strong> {saleName}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Transaction ID:</strong> {transactionId}
            </Text>

            <Text style={styles.detailItem}>
              <strong>Quantity:</strong> {quantity} {tokenSymbol}
            </Text>
          </Section>

          <Section style={styles.reasonSection}>
            <Heading style={styles.h3}>Reason for Cancellation:</Heading>
            <Text style={styles.paragraph}>{reason}</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What This Means:</Heading>
            <Text style={styles.listItem}>
              • Your transaction has been cancelled and will not be processed
            </Text>
            <Text style={styles.listItem}>
              • No tokens will be transferred to your wallet
            </Text>
            <Text style={styles.listItem}>
              • If you made a payment, please request a refund via email
            </Text>
            <Text style={styles.listItem}>
              • You may attempt to purchase again if the sale is still active
            </Text>
          </Section>

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              If you have any questions about this cancellation or need
              assistance, please don't hesitate to reach out to our support
              team.
            </Text>

            <Button style={styles.button} href={`mailto:${supportEmail}`}>
              Contact Support
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            We apologize for any inconvenience this may have caused. Please
            contact us at{' '}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>{' '}
            if you need assistance or have any questions.
          </Text>

          <Text style={styles.signature}>
            Thank you for your understanding.
            <br />
            The {saleName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

TransactionCancelledEmail.PreviewProps = {
  userName: 'John Doe',
  saleName: 'Mahjong Stars ICO',
  transactionId: 'TX-1234567890',
  quantity: '1,000',
  tokenSymbol: 'MJS',
  reason:
    'Payment verification failed due to insufficient funds in the source wallet.',
  supportEmail: 'hello@mahjonstars.com',
} satisfies TransactionCancelledProps;

export default TransactionCancelledEmail;
