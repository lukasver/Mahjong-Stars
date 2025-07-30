import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import { container, h1, main, text } from './shared-styles';

type WaitlistEmailProps = {
  name: string;
};

export const WaitlistEmail = ({ name }: WaitlistEmailProps) => (
  <Html>
    <Head />
    <Preview>Thank you for joining our waitlist and for your patience</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Coming Soon.</Heading>
        <Text style={text}>
          Thank you {name} for joining our waitlist and for your patience. We
          will send you a note when we have something new to share.
        </Text>
      </Container>
    </Body>
  </Html>
);

WaitlistEmail.PreviewProps = {
  name: 'John Doe',
} satisfies WaitlistEmailProps;

export default WaitlistEmail;
