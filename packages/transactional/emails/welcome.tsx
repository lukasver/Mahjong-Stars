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
} from '@react-email/components';
import * as styles from './shared-styles';

type WelcomeEmailProps = {
  name: string;
  url: string;
  companyName?: string;
};

export const WelcomeEmail = ({
  name = 'User',
  url = 'https://example.com',
  companyName = 'Our Company',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {companyName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.logo}>
            <Text style={styles.logoText}>{companyName}</Text>
          </Section>
          <Section style={styles.content}>
            <Heading style={styles.heading}>Welcome, {name}!</Heading>
            <Text style={styles.paragraph}>
              We're thrilled to have you on board. Your account has been created
              successfully.
            </Text>
            <Text style={styles.paragraph}>
              To get started, please click the button below to verify your
              account:
            </Text>
            <Button style={styles.button} href={url}>
              Verify Account
            </Button>
            <Text style={styles.paragraph}>
              If you have any questions, feel free to{' '}
              <Link href='mailto:support@example.com' style={styles.link}>
                contact our support team
              </Link>
              .
            </Text>
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  name: 'John Doe',
  url: 'https://example.com/verify?token=abc123',
  companyName: 'MyToken Platform',
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
