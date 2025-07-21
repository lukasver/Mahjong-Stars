// import { getSession } from '../../lib/auth/better-auth/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { VerifyEmail } from '../../components/verify-email';
import { getCurrentUser } from '@/lib/actions';
import { cn } from '@mjs/ui/lib/utils';

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
    <div className={cn('relative size-full')}>
      <div className='grid min-h-[100dvh] grid-rows-[auto_1fr_auto]'>
        <header className='invisible'>a</header>
        <main className='container mx-auto grid place-items-center bg-cover bg-center relative z-20'>
          {children}
        </main>
        <footer className='invisible'>a</footer>
      </div>
      <div
        className={cn(
          'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center w-full h-full -z-50!',
          'size-full absolute inset-0'
        )}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-primary to-5% to-transparent -z-40!' />
      </div>
    </div>
  );
};
