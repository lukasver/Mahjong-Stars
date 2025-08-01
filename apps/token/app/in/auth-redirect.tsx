'use client';

import { PulseLoader } from '@/components/pulse-loader';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function AuthRedirect() {
  const searchParams = useSearchParams();
  const to = searchParams.get('to');
  const router = useRouter();
  useEffect(() => {
    if (to) {
      router.replace(to);
    }
  }, [to, router]);
  return <PulseLoader />;
}
