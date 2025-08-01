import AdminSidebar from '@/app/(dash)/dashboard/admin-sidebar';
import { DashboardHeader } from '@/app/(dash)/dashboard/header';
import { PagesProviders } from '@/app/providers';
import { getFooterLinks, metadata } from '@/common/config/site';
import BackgroundWrapper from '@/components/bg-wrapper';
import { BuyTokenButton } from '@/components/buy-token-button';
import { InputOptionsProvider } from '@/components/hooks/use-input-options';
import { DashboardSidebar } from '@/components/sidebar';
import { getCurrentUser } from '@/lib/services/fetchers-server';
import { isAdmin } from '@/lib/utils';
import { Footer } from '@mjs/ui/components/footer';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  const [user, t] = await Promise.all([
    // Used for checking if the user is admin
    queryClient.fetchQuery({
      queryKey: ['user', 'me'],
      queryFn: () => getCurrentUser(),
    }),
    getTranslations(),
  ]);

  if (!user?.data || !isAdmin(user.data.roles)) {
    redirect('/?error=unauthorized');
  }

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
            <section className='flex-1 grid grid-rows-[auto_1fr_auto]'>
              <DashboardHeader>
                <Suspense fallback={null}>
                  <BuyTokenButton />
                </Suspense>
              </DashboardHeader>
              <InputOptionsProvider>
                <BackgroundWrapper>
                  <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
                    <main className='container mx-auto z-10 py-4 sm:py-10'>
                      {children}
                    </main>
                  </div>
                </BackgroundWrapper>
              </InputOptionsProvider>
              <Footer
                siteConfig={metadata}
                links={getFooterLinks(t)}
                copyright={t('Footer.copyright', {
                  year: new Date().getFullYear(),
                })}
                className='bg-black'
              />
            </section>
          </>
        </PagesProviders>
      </HydrationBoundary>
    </>
  );
}
