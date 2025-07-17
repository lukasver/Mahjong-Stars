// import { getSession } from '../../lib/auth/better-auth/auth';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { VerifyEmail } from '../../components/verify-email';
import { getCurrentUser } from '@/lib/actions';
import { cn } from '@mjs/ui/lib/utils';

export default async function Onboarding() {
  const res = await getCurrentUser();

  if (!res?.data) {
    redirect('/?error=unauthorized');
  }

  const user = res.data;

  if (!user.emailVerified) {
    return (
      <Container>
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyEmail />
        </Suspense>

        <Image
          src='/static/images/bg.webp'
          alt='bg'
          width={1440}
          height={1024}
          className='w-full h-full object-cover fixed z-[-1] inset-0'
        />
      </Container>
    );
  }

  return (
    <Container>
      {/* <ConnectWallet /> */}

      <Image
        src='/static/images/bg.webp'
        alt='bg'
        width={1440}
        height={1024}
        className='w-full h-full object-cover fixed z-[-1] inset-0'
      />
    </Container>
  );
}

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center w-full h-full'
      )}
    >
      <div
        className={cn(
          'p-4 relative mx-auto max-w-7xl space-y-8',
          'bg-gradient-to-b from-primary to-5% to-transparent'
        )}
      >
        <div className='grid min-h-[100dvh] grid-rows-[auto_1fr_auto]'>
          <header className='invisible'>a</header>
          <main className='container mx-auto grid place-items-center bg-cover bg-center relative'>
            {children}
          </main>
          <footer className='invisible'>a</footer>
        </div>
      </div>
    </div>
  );
};
