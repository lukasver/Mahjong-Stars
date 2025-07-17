import Image from 'next/image';
import { LoginForm } from '../components/login';

export default async function Login() {
  return (
    <div className={'grid min-h-[100dvh] grid-rows-[auto_1fr_auto]'}>
      <div />
      <main className='grid place-items-center bg-cover bg-center relative'>
        <div className='relative z-10 flex flex-col gap-4 items-center p-10 rounded-md'>
          <div>
            <Image
              src='/static/images/logo-wt.webp'
              alt='logo'
              width={235}
              height={78}
            />
            <span className='sr-only'>Mahjong Stars</span>
          </div>
          <div className='bg-transparent w-full max-w-80'>
            <LoginForm />
          </div>
        </div>
        <Image
          src='/static/images/bg.webp'
          alt='bg'
          width={1440}
          height={1024}
          className='w-full h-full object-cover fixed z-[-1] inset-0'
        />
      </main>
      <div />
    </div>
  );
}
