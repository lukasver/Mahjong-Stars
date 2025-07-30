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

export interface ICOSaleEndedEmailProps {
  adminName?: string;
  tokenName: string;
  tokenSymbol: string;
  endReason: string;
  saleEndTime: string;
  totalRaised?: string;
  tokensDistributed?: string;
  dashboardUrl?: string;
  supportEmail?: string;
}

export const ICOSaleEndedEmail = ({
  adminName = 'Admin',
  tokenName,
  tokenSymbol,
  endReason,
  saleEndTime,
  totalRaised,
  tokensDistributed,
  dashboardUrl = '#',
  supportEmail = 'support@company.com',
}: ICOSaleEndedEmailProps) => (
  <Html>
    <Head />
    <Preview>
      ICO Sale for {tokenName} ({tokenSymbol}) has ended - Action Required
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>Sale Ended</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {adminName},</Text>

          <Text style={styles.paragraph}>
            We're writing to inform you that the ICO sale for{' '}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{' '}
            has ended.
          </Text>

          <Section style={styles.alertBox}>
            <Text style={styles.alertTitle}>Sale End Reason:</Text>
            <Text style={styles.alertReason}>{endReason}</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Sale Summary</Heading>

            <Text style={styles.detailItem}>
              <strong>Token:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>End Time:</strong> {saleEndTime}
            </Text>

            {totalRaised && (
              <Text style={styles.detailItem}>
                <strong>Total Raised:</strong> {totalRaised}
              </Text>
            )}

            {tokensDistributed && (
              <Text style={styles.detailItem}>
                <strong>Tokens Distributed:</strong> {tokensDistributed}
              </Text>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Please review the sale details and take any necessary follow-up
              actions in your dashboard.
            </Text>

            <Button style={styles.button} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you have any questions or need assistance, please contact our
            support team at{' '}
            <Link href={`mailto:${supportEmail}`} style={styles.link}>
              {supportEmail}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

ICOSaleEndedEmail.PreviewProps = {
  adminName: 'Admin User',
  tokenName: 'MyToken',
  tokenSymbol: 'MTK',
  endReason: 'Sale reached maximum token allocation',
  saleEndTime: '2024-01-15 23:59:59 UTC',
  totalRaised: '500,000 USDC',
  tokensDistributed: '5,000,000 MTK',
  dashboardUrl: 'https://admin.example.com',
  supportEmail: 'support@example.com',
} satisfies ICOSaleEndedEmailProps;

export default ICOSaleEndedEmail;
