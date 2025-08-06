import { getIcoPhases } from '@/lib/services/fetchers.server';
import { IcoPhasesError } from './ico-phases-error';
import { IcoPhases } from './ico-phases-client';

/**
 * Server component that fetches and displays ICO phases from sales data
 */
export async function IcoPhasesSSR() {
  try {
    const res = await getIcoPhases();

    const sales = res.data?.sales;

    if (!sales || !sales.length) {
      return <IcoPhasesError />;
    }

    return <IcoPhases sales={sales} />;
  } catch (error) {
    console.error('Error fetching ICO phases:', error);
    return <IcoPhasesError />;
  }
}
