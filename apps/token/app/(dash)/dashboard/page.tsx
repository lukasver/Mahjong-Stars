import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { VisuallyHidden } from "@mjs/ui/primitives/visually-hidden";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  DashboardCardLoading,
  RemainingTokensCard,
  TokenPriceCard,
  UnconfirmedTokensCard,
  UserTokensCard,
} from "@/components/dashboard/cards";
import { IcoPhasesSSR } from "@/components/dashboard/ico-phases";
import {
  IcoPhasesLoading,
  RecentTransactionsLoading,
} from "@/components/dashboard/loading-components";
import { RecentTransactionsSSR } from "@/components/dashboard/recent-transactions";
import { FeatureCards } from "@/components/feature-cards";
import {
  getActiveSale,
  getUserFromSession,
} from "@/lib/services/fetchers.server";
import { ComingSoonContent } from "../../../components/coming-soon";
import { FundraisingProgress } from "../../../components/dashboard/fundraising-progress";

export default async function DashboardPage(_props: PageProps<"/dashboard">) {
  const queryClient = new QueryClient();

  const [user] = await Promise.all([
    getUserFromSession(),
    queryClient.prefetchQuery({
      queryKey: ["sales", "active"],
      queryFn: () => getActiveSale(),
    }),
  ]);

  if (!user) {
    redirect("/in?error=invalid_session");
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="py-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Please connect your wallet</h1>
        </div>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="flex flex-col gap-4 sm:gap-8">
          <VisuallyHidden>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Dashboard
            </h1>
          </VisuallyHidden>
          {/* <Suspense fallback={null}>
        <TokenDetails />
      </Suspense> */}

          <ErrorBoundary
            fallback={
              <div className="py-6">
                <ComingSoonContent to={undefined} />
              </div>
            }
          >
            {/* <Suspense fallback={<FundraisingProgressLoading />}> */}
            <FundraisingProgress>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                <Suspense fallback={<DashboardCardLoading />}>
                  <UserTokensCard />
                </Suspense>
                <Suspense fallback={<DashboardCardLoading />}>
                  <UnconfirmedTokensCard />
                </Suspense>
                <Suspense fallback={<DashboardCardLoading />}>
                  <TokenPriceCard />
                </Suspense>
                <Suspense fallback={<DashboardCardLoading />}>
                  <RemainingTokensCard />
                </Suspense>
                {/* <Suspense fallback={null}>
              <TokenVolumeCard />
            </Suspense> */}
              </div>
            </FundraisingProgress>
            {/* </Suspense> */}
          </ErrorBoundary>

          {/* <ErrorBoundary fallback={null}>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <Suspense fallback={null}>
            <TokenStats />
          </Suspense>
        </div>
      </ErrorBoundary> */}

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* <TokenMetrics /> */}
            <Suspense fallback={<RecentTransactionsLoading />}>
              <RecentTransactionsSSR />
            </Suspense>
            <Suspense fallback={<IcoPhasesLoading />}>
              <IcoPhasesSSR />
            </Suspense>
          </div>
          <FeatureCards />
        </div>
      </HydrationBoundary>
    </ErrorBoundary>
  );
}

export const dynamic = "force-dynamic";
