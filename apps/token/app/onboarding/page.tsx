// import { getSession } from '../../lib/auth/better-auth/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { VerifyEmail } from '../../components/verify-email';
import { getCurrentUser } from '@/lib/actions';
import BackgroundWrapper from '@/components/bg-wrapper';
import { PointerEventsGuard } from '@/components/thirdweb/pointer-events-guard';

export default async function Onboarding({ searchParams }: PageProps) {
  const [res, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (!res?.data) {
    redirect('/?error=unauthorized');
  }

  const user = res.data;

  if (user.emailVerified) {
    redirect('/dashboard');
  }

  return (
    <Container>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmail token={params.token ? String(params.token) : ''} />
      </Suspense>
    </Container>
  );
}

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <PointerEventsGuard>
      <BackgroundWrapper className={'size-full'}>
        <div className='grid min-h-[100dvh] grid-rows-[auto_1fr_auto]'>
          <header className='invisible'>a</header>
          <main className='container mx-auto grid place-items-center bg-cover bg-center relative z-20'>
            {children}
          </main>
          <footer className='invisible'>a</footer>
        </div>
      </BackgroundWrapper>
    </PointerEventsGuard>
  );
};
