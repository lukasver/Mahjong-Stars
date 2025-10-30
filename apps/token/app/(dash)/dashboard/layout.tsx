import { Footer } from "@mjs/ui/components/footer";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PagesProviders } from "@/app/providers";
import { getFooterLinks, metadata } from "@/common/config/site";
import BackgroundWrapper from "@/components/bg-wrapper";
import { BuyTokenButton } from "@/components/buy-token-button";
import {
  getCurrentUser,
  getUserFromSession,
} from "@/lib/services/fetchers.server";
import { DashboardSidebar } from "../../../components/sidebar";
import AdminSidebar from "./admin-sidebar";
import { DashboardHeader } from "./header";

/**
 * Layout component for the dashboard section
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();
  const [t, user] = await Promise.all([
    getTranslations(),
    getUserFromSession(),
  ]);

  if (!user) {
    redirect("/in?error=invalid_session");
  }

  await queryClient.prefetchQuery({
    queryKey: ["user", "me"],
    queryFn: () => getCurrentUser(),
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PagesProviders>
          <DashboardSidebar>
            <Suspense fallback={null}>
              <AdminSidebar />
            </Suspense>
          </DashboardSidebar>

          <div className='flex-1 grid grid-rows-[auto_1fr_auto]'>
            <DashboardHeader>
              <Suspense fallback={null}>
                <BuyTokenButton />
              </Suspense>
            </DashboardHeader>
            <BackgroundWrapper>
              <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
                <main className='container mx-auto z-10 py-4 sm:py-6 md:py-10 px-4 sm:px-6 lg:px-10 xl:px-20 xl:py-20'>
                  {children}
                </main>
              </div>
            </BackgroundWrapper>
            <Footer
              siteConfig={metadata}
              links={getFooterLinks(t)}
              copyright={t('Footer.copyright', {
                year: new Date().getFullYear(),
              })}
              className='bg-black'
            />
          </div>
        </PagesProviders>
      </HydrationBoundary >
    </>
  )
}
