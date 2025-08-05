import { SuccessContent } from '@/components/buy/confirmation-steps/success-content';

/**
 * Success status page for dashboard actions.
 * Shows success message, project name, support email, and transaction link if available.
 */
const Success = () => {
  return <SuccessContent className='min-h-[60dvh] grid place-content-center' />;
};

export default Success;
