import {
  Body,
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

type ContactFormEmailProps = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const ContactFormEmail = ({
  name = 'John Doe',
  email = 'john@example.com',
  subject = 'General Inquiry',
  message = 'Hello, I would like to get in touch with you regarding your services.',
}: ContactFormEmailProps) => (
  <Html>
    <Head />
    <Preview>New contact form submission from {name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Heading style={styles.h1}>New Contact Form Submission</Heading>
        <Section style={styles.section}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{name}</Text>
        </Section>

        <Section style={styles.section}>
          <Text style={styles.label}>Email:</Text>
          <Link href={`mailto:${email}`} style={styles.emailLink}>
            {email}
          </Link>
        </Section>

        <Section style={styles.section}>
          <Text style={styles.label}>Subject:</Text>
          <Text style={styles.value}>{subject}</Text>
        </Section>

        <Hr style={styles.divider} />

        <Section style={styles.section}>
          <Text style={styles.label}>Message:</Text>
          <Text style={styles.messageText}>{message}</Text>
        </Section>

        <Hr style={styles.divider} />

        <Text style={styles.footer}>
          This message was sent from your website contact form.
        </Text>
      </Container>
    </Body>
  </Html>
);

ContactFormEmail.PreviewProps = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  subject: 'General Inquiry',
  message:
    'Hello, I would like to get in touch with you regarding your services. I have some questions about your platform and would appreciate if you could provide more information.',
} satisfies ContactFormEmailProps;

export default ContactFormEmail;
