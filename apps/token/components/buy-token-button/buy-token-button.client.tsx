"use client";

import { RainbowButton } from '@mjs/ui/components/rainbow-button';
import { cn } from '@mjs/ui/lib/utils';
import { usePathname } from 'next/navigation';
import AppLink from '../link';

export function BuyTokenButtonClient({ className, symbol }: { className?: string, symbol: string }) {
  const pathname = usePathname();
  const isInBuyPage = pathname && pathname === "/dashboard/buy";
  return (
    <AppLink
      prefetch={!isInBuyPage}
      href={isInBuyPage ? "#invest-component" : `/dashboard/buy`}
      scroll
      className={'contents'}
    >
      <RainbowButton
        className={cn(
          "font-head px-4 py-2 border-2 shadow-sm border-solid bg-accent rounded-xl h-full hover:bg-accent/80 transition-all duration-300 hover:scale-105 hover:animate-pulse",
          className,
        )}
      >
        Buy {symbol}
      </RainbowButton>
    </AppLink>
  );
}
