'use client';

import { PulseLoader } from '@/components/pulse-loader';
import { logout } from '@/lib/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function AuthRedirect() {
  const searchParams = useSearchParams();
  const to = searchParams.get('to');
  const error = searchParams.get('error');
  const router = useRouter();
  useEffect(() => {
    if (to) {
      router.replace(to);
    }
    if (error) {
      (async () => {
        // Server action to delete session cookie
        await logout({ redirectTo: '/', redirect: true });
      })();
    }
  }, [to, router, error]);

  if (error) {
    return (
      <PulseLoader>
        <div className='flex flex-col gap-1 items-start'>
          <span className='text-xl font-bold font-head'>Redirecting...</span>
          <span className='text-base font-semibold font-common text-secondary'>
            {error}
          </span>
        </div>
      </PulseLoader>
    );
  }
  return <PulseLoader text={error ? 'Redirecting...' : 'Loading...'} />;
}
