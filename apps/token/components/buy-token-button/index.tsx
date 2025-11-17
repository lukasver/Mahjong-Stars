import { getActiveSale } from "@/lib/services/fetchers.server";
import { BuyTokenButtonClient } from './buy-token-button.client';

export async function BuyTokenButton({ className }: { className?: string }) {
  const data = await getActiveSale();

  if (!data?.data) {
    return null;
  }
  const sale = data.data?.sales?.[0];
  if (!sale) {
    return null;
  }

  return <BuyTokenButtonClient className={className} symbol={sale.tokenSymbol} />;
}
