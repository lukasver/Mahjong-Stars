import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React, { Suspense } from "react";
import AdminSidebar from "@/app/(dash)/dashboard/admin-sidebar";
import { DashboardHeader } from "@/app/(dash)/dashboard/header";
import { PagesProviders } from "@/app/providers";
import BackgroundWrapper from "@/components/bg-wrapper";
import { BuyTokenButton } from "@/components/buy-token-button";
import { Footer } from "@/components/footer";
import { InputOptionsProvider } from "@/components/hooks/use-input-options";
import { DashboardSidebar } from "@/components/sidebar";
import {
  getCurrentUser,
  getUserFromSession,
} from "@/lib/services/fetchers.server";
import { isAdmin } from "@/lib/utils";
import Logo from "@/public/static/images/logos/isologo-min.webp";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  const [user, _t] = await Promise.all([
    getUserFromSession(),
    getTranslations(),
  ]);

  if (!user || !isAdmin(user.roles)) {
    redirect("/?error=unauthorized");
  }

  await queryClient.prefetchQuery({
    queryKey: ["user", "me"],
    queryFn: () => getCurrentUser(),
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PagesProviders>
          <>
            <DashboardSidebar>
              <Suspense fallback={null}>
                <AdminSidebar />
              </Suspense>
            </DashboardSidebar>
            <section className="flex-1 grid grid-rows-[auto_1fr_auto]">
              <DashboardHeader>
                <Suspense fallback={null}>
                  <BuyTokenButton />
                </Suspense>
              </DashboardHeader>
              <InputOptionsProvider>
                <BackgroundWrapper>
                  <div className="relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40">
                    <main className="container mx-auto z-10 py-4 sm:py-10 px-4 sm:px-10 xl:px-20 xl:py-20">
                      {children}
                    </main>
                  </div>
                </BackgroundWrapper>
              </InputOptionsProvider>
              <Footer
                title={'The Tiles Company'}
                description={'Empowering MJS with Web3'}
                logo={Logo}
              />
            </section>
          </>
        </PagesProviders>
      </HydrationBoundary>
    </>
  );
}

export const dynamic = "force-dynamic";
