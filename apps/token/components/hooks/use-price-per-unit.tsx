import calculator from '@/lib/services/pricefeeds';
import { toast } from '@mjs/ui/primitives/sonner';
import { useState } from 'react';
import { useEffect } from 'react';

interface usePricePerUnitProps {
  from: string | null;
  to: string | null;
  onError?: () => void;
  base: string;
  addManagementFee?: boolean;
  precision?: number;
  enabled?: boolean;
}
export const usePricePerUnit = ({
  from,
  to,
  onError,
  base,
  enabled,
  precision,
  ...rest
}: usePricePerUnitProps) => {
  const [pricePerUnit, setPricePerUnit] = useState<string | null>(base || null);
  const trigger = !!from && !!to && enabled && base;

  useEffect(() => {
    if (trigger) {
      const fetchData = async () => {
        if (enabled && from && to) {
          try {
            const { pricePerUnit } = await calculator.getAmountAndPricePerUnit({
              initialCurrency: from,
              currency: to,
              quantity: 0,
              base: base,
              precision,
              ...rest,
            });
            setPricePerUnit(pricePerUnit);
          } catch (_error) {
            toast.error('Ops! someting wrong.');
            onError?.();
          }
        }
      };
      fetchData();
    }
  }, [trigger]);

  return [pricePerUnit, setPricePerUnit] as const;
};
