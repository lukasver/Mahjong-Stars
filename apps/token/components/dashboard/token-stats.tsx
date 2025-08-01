import { getWeb3Contract } from '@/lib/actions';
import { QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { cache } from 'react';
import { TokenStatsLoading } from '../skeletons/large-cards-loading';
import { TokenStatCard } from './token-stats-card';

const sleep = cache(
  (ms: number) =>
    new Promise((resolve) => {
      const random = Math.random();
      setTimeout(
        () =>
          resolve({
            value: '1,245',
            changeText: random > 0.5 ? '+123 users' : '-12 users',
            changePercentage: random > 0.5 ? '10.8%' : '-1.4%',
            interval: 'week',
          }),
        ms
      );
    })
);

export async function TokenStats({ address }: { address: string }) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['contract', address],
    queryFn: () => getWeb3Contract(address),
  });

  return (
    <>
      <Suspense fallback={<TokenStatsLoading />}>
        <TokenPriceCard />
      </Suspense>
      <Suspense fallback={<TokenStatsLoading />}>
        <TokenMarketCapCard />
      </Suspense>
      <Suspense fallback={<TokenStatsLoading />}>
        <TokenTotalHoldersCard />
      </Suspense>
    </>
  );
}

// //TODO! do actual data fetching

const TokenPriceCard = async () => {
  const data = await sleep(3000);
  //@ts-expect-error TODO! do actual data fetching
  return <TokenStatCard data={data} title='Token Price' icon='dollar' />;
};

const TokenMarketCapCard = async () => {
  const data = await sleep(3000);
  //@ts-expect-error TODO! do actual data fetching
  return <TokenStatCard data={data} title='Market Cap' icon='dollar' />;
};

const TokenTotalHoldersCard = async () => {
  const data = await sleep(4000);
  //@ts-expect-error TODO! do actual data fetching
  return <TokenStatCard data={data} title='Total Holders' icon='users' />;
};
