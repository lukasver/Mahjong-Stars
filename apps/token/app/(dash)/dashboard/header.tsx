'use client';

import { ConnectWallet } from '@/components/connect-wallet';

import { ThemeSwitcher } from '@mjs/ui/components/theme-switcher';
import { Separator } from '@mjs/ui/primitives/separator';
import { SidebarTrigger } from '@mjs/ui/primitives/sidebar';

export function DashboardHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className='sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-3 sm:px-4 backdrop-blur-sm md:px-6 w-full'>
      <SidebarTrigger />
      <div className='flex items-center gap-1 sm:gap-2 lg:gap-4'></div>
      <div className='flex items-center gap-1 sm:gap-2'>
        <ThemeSwitcher />
        <Separator orientation='vertical' className='h-6 sm:h-8' />
        {children ? (
          <>
            {children}
            <Separator orientation='vertical' className='h-6 sm:h-8' />
          </>
        ) : null}
        <ConnectWallet />
      </div>
    </header>
  );
}
