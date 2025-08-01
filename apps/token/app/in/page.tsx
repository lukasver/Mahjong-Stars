import BackgroundWrapper from '@/components/bg-wrapper';
import { PulseLoader } from '@/components/pulse-loader';
import { AuthRedirect } from './auth-redirect';
import { Suspense } from 'react';

export default async function AuthRedirectPage(_props: PageProps) {
  return (
    <BackgroundWrapper>
      <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
        <main className='container mx-auto z-10 py-4 sm:py-10 px-4 sm:px-10 xl:px-20 xl:py-20 h-screen flex items-center justify-center'>
          <Suspense fallback={<PulseLoader />}>
            <AuthRedirect />
          </Suspense>
        </main>
      </div>
    </BackgroundWrapper>
  );
}
