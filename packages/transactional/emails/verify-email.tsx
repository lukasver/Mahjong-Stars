import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as styles from './shared-styles';

type EmailVerificationProps = {
  url: string;
  logoUrl: string;
  token?: string;
};

export const EmailVerification = ({
  url,
  logoUrl,
  token,
}: EmailVerificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Email Verification</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Heading>
              {logoUrl && (
                <Img
                  src={logoUrl}
                  alt={'logo'}
                  width='100'
                  style={styles.logo}
                />
              )}
            </Heading>
          </Section>
          <Text style={styles.heading}>Verify your email</Text>
          <Text style={styles.text}>
            Thank you for being a part of the community. To verify your email,
            we kindly request you to paste the following code on the page.
          </Text>
          <Container style={styles.tokenContainer}>
            {token && (
              <Section style={styles.verificationSection}>
                <Text style={styles.verifyText}>Verification code</Text>

                <Text style={styles.codeText}>{token}</Text>
                <Text style={styles.validityText}>
                  (This code is valid for 10 minutes)
                </Text>
              </Section>
            )}
            <Text style={styles.text}>
              Or paste the following url in your browser:
            </Text>
            <Text style={styles.fontToken}> {url}</Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
};

EmailVerification.PreviewProps = {
  url: 'https://example.com',
  logoUrl:
    'https://storage.googleapis.com/mjs-public/branding/icon-120x120.png',
  token: '596853',
} satisfies EmailVerificationProps;

export default EmailVerification;
