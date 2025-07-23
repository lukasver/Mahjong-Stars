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

export const WelcomeEmail = ({
  name = 'User',
  url = 'https://example.com',
  companyName = 'Our Company',
}: {
  name: string;
  url: string;
  companyName?: string;
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Text style={logoText}>{companyName}</Text>
          </Section>
          <Section style={content}>
            <Heading style={heading}>Welcome, {name}!</Heading>
            <Text style={paragraph}>
              We're thrilled to have you on board. Your account has been created
              successfully.
            </Text>
            <Text style={paragraph}>
              To get started, please click the button below to verify your
              account:
            </Text>
            <Button style={button} href={url}>
              Verify Account
            </Button>
            <Text style={paragraph}>
              If you have any questions, feel free to{' '}
              <Link href='mailto:support@example.com' style={link}>
                contact our support team
              </Link>
              .
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '5px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '24px',
};

const logoText = {
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  color: '#5269e7',
};

const content = {
  padding: '0 48px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  margin: '16px 0',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4043',
};

const button = {
  backgroundColor: '#5269e7',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  margin: '24px auto',
};

const hr = {
  borderColor: '#e8eaed',
  margin: '48px 0 24px',
};

const footer = {
  color: '#9ca299',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '16px',
};

const link = {
  color: '#5269e7',
  textDecoration: 'underline',
};
