import { getActiveSale } from '@/lib/services/fetchers.server';
import { RainbowButton } from '@mjs/ui/components/rainbow-button';
import { cn } from '@mjs/ui/lib/utils';
import Link from 'next/link';

export async function BuyTokenButton({ className }: { className?: string }) {
  const data = await getActiveSale();

  if (!data?.data) {
    return null;
  }
  const sale = data.data?.sales?.[0];
  if (!sale) {
    return null;
  }
  return (
    <Link prefetch href={`/dashboard/buy`}>
      <RainbowButton
        className={cn(
          'font-head border-2 shadow-sm border-solid bg-accent rounded-xl h-full hover:bg-accent/80 transition-all duration-300 hover:scale-105 hover:animate-pulse',
          className
        )}
      >
        Buy {sale.tokenSymbol}
      </RainbowButton>
    </Link>
  );
}
