'use client';
import { FailureContent } from '@/components/buy/confirmation-steps/failure-content';

/**
 * Failure status page for dashboard actions.
 * Shows error message, project name, support email, and transaction link if available.
 */
const Failure = () => {
  return (
    <FailureContent className='min-h-screen md:min-h-[60dvh] grid place-content-center' />
  );
};

export default Failure;
