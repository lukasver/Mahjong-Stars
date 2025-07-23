import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export const EmailVerification = ({
  url,
  logoUrl,
}: {
  url: string;
  logoUrl: string;
}) => {
  return (
    <Html>
      <Head />
      <Preview>Email Verification</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading>
              {logoUrl && (
                <Img src={logoUrl} alt={'logo'} width='215' style={logo} />
              )}
            </Heading>
          </Section>
          <Text style={heading}>Verify your email</Text>
          <Text style={text}>
            Thank you for being a part of the community. To verify your email,
            we kindly request you to paste the following code on the page.
          </Text>
          <Container style={tokenContainer}>
            <Button style={buttonStyles} href={url}>
              Verify Email
            </Button>
            <Text style={text}>
              Or paste the following url in your browser:
            </Text>
            <Text style={fontToken}> {url}</Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  fontFamily: 'arial, helvetica, sans-serif',
};

const buttonStyles = {
  backgroundColor: '#ffffff',
  color: '#4a0000',
  padding: '10px 20px',
  borderRadius: '5px',
  textDecoration: 'none',
};

const container = {
  margin: '10px auto',
  display: 'flex',
  alignItem: 'center',
  justifyContent: 'center',
  justifyItems: 'center',
};
const heading = {
  fontSize: '18px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#4a0000',
  padding: '17px 0 0',
};

const logo = {
  margin: '0 auto',
};

const text = {
  color: '#3c4149',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 40px',
};

const fontToken = {
  color: '#000000',
  fontSize: '12px',
};

const tokenContainer = {
  textAlign: 'center' as const,
};
