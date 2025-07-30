import { Button, Html } from '@react-email/components';
import * as styles from './shared-styles';

type TestEmailProps = {};

export const TestEmail = () => {
  return (
    <Html>
      <Button href='https://example.com' style={styles.button}>
        Click me
      </Button>
    </Html>
  );
};

TestEmail.PreviewProps = {} satisfies TestEmailProps;

export default TestEmail;
