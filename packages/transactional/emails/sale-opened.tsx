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

export interface ICOSaleOpenedEmailProps {
  userName?: string;
  tokenName: string;
  tokenSymbol: string;
  saleStartTime: string;
  saleEndTime?: string;
  tokenPrice?: string;
  minPurchase?: string;
  maxPurchase?: string;
  totalTokens?: string;
  saleUrl?: string;
  supportEmail?: string;
}

export const ICOSaleOpenedEmail = ({
  userName = 'User',
  tokenName,
  tokenSymbol,
  saleStartTime,
  saleEndTime,
  tokenPrice,
  minPurchase,
  maxPurchase,
  totalTokens,
  saleUrl = '#',
  supportEmail = 'support@company.com',
}: {
  userName?: string;
  tokenName: string;
  tokenSymbol: string;
  saleStartTime: string;
  saleEndTime?: string;
  tokenPrice?: string;
  minPurchase?: string;
  maxPurchase?: string;
  totalTokens?: string;
  saleUrl?: string;
  supportEmail?: string;
}) => (
  <Html>
    <Head />
    <Preview>
      New ICO Sale for {tokenName} ({tokenSymbol}) is now live!
    </Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>Sale Now Live!</Heading>
        </Section>

        <Section style={styles.content}>
          <Text style={styles.greeting}>Hello {userName},</Text>

          <Text style={styles.paragraph}>
            Great news! The ICO sale for{' '}
            <strong>
              {tokenName} ({tokenSymbol})
            </strong>{' '}
            is now live and accepting investments.
          </Text>

          <Section style={styles.successBox}>
            <Text style={styles.successTitle}>Sale Status</Text>
            <Text style={styles.successMessage}>
              Sale is now active and accepting contributions
            </Text>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.detailsSection}>
            <Heading style={styles.h2}>Sale Details</Heading>

            <Text style={styles.detailItem}>
              <strong>Token:</strong> {tokenName} ({tokenSymbol})
            </Text>

            <Text style={styles.detailItem}>
              <strong>Start Time:</strong> {saleStartTime}
            </Text>

            {saleEndTime && (
              <Text style={styles.detailItem}>
                <strong>End Time:</strong> {saleEndTime}
              </Text>
            )}

            {tokenPrice && (
              <Text style={styles.detailItem}>
                <strong>Token Price:</strong> {tokenPrice}
              </Text>
            )}

            {minPurchase && (
              <Text style={styles.detailItem}>
                <strong>Minimum Purchase:</strong> {minPurchase}
              </Text>
            )}

            {maxPurchase && (
              <Text style={styles.detailItem}>
                <strong>Maximum Purchase:</strong> {maxPurchase}
              </Text>
            )}

            {totalTokens && (
              <Text style={styles.detailItem}>
                <strong>Total Tokens Available:</strong> {totalTokens}
              </Text>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.actionSection}>
            <Text style={styles.paragraph}>
              Don't miss out on this opportunity! Click the button below to
              participate in the sale.
            </Text>

            <Button style={styles.button} href={saleUrl}>
              Participate in Sale
            </Button>
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.nextStepsSection}>
            <Heading style={styles.h3}>What's Next?</Heading>
            <Text style={styles.listItem}>
              • Review the token details and whitepaper
            </Text>
            <Text style={styles.listItem}>
              • Complete your KYC verification if required
            </Text>
            <Text style={styles.listItem}>
              • Connect your wallet to participate
            </Text>
            <Text style={styles.listItem}>
              • Monitor the sale progress in your dashboard
            </Text>
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

ICOSaleOpenedEmail.PreviewProps = {
  userName: 'John Doe',
  tokenName: 'MyToken',
  tokenSymbol: 'MTK',
  saleStartTime: '2024-01-15 00:00:00 UTC',
  saleEndTime: '2024-02-15 23:59:59 UTC',
  tokenPrice: '0.10 USDC',
  minPurchase: '100 USDC',
  maxPurchase: '10,000 USDC',
  totalTokens: '10,000,000 MTK',
  saleUrl: 'https://sale.example.com',
  supportEmail: 'support@example.com',
} satisfies ICOSaleOpenedEmailProps;

export default ICOSaleOpenedEmail;
