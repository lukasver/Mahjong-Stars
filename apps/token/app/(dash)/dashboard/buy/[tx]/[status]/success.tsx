import BackgroundWrapper from '@/components/bg-wrapper';
import { SuccessContent } from '@/components/buy/confirmation-steps/success-content';

/**
 * Success status page for dashboard actions.
 * Shows success message, project name, support email, and transaction link if available.
 */
const Success = () => {
  return (
    <BackgroundWrapper>
      <SuccessContent className='min-h-screen grid place-content-center bg-gradient-to-b from-primary to-5% to-transparent h-full' />
    </BackgroundWrapper>
  );
};

export default Success;
