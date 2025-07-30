import { PagesProviders } from '@/app/providers';
import { getFooterLinks, metadata } from '@/common/config/site';
import { BuyTokenButton } from '@/components/buy-token-button';
import { Footer } from '@mjs/ui/components/footer';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DashboardSidebar } from '../../../components/sidebar';
import AdminSidebar from './admin-sidebar';
import { DashboardHeader } from './header';
import { getCurrentUser } from '@/lib/actions';
import usersController from '@/lib/repositories/users';
import { getSessionCookie } from '@/lib/auth/cookies';
import { verifyJwt } from '@/lib/auth/thirdweb';

/**
 * Layout component for the dashboard section
 * Provides Wagmi context and ensures wallet connectivity
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();
  const t = await getTranslations();

  queryClient.prefetchQuery({
    queryKey: ['user', 'me'],
    queryFn: () => getCurrentUser(),
  });

  const data = String((await getSessionCookie()) || '');
  const verified = await verifyJwt(data);
  if (!verified.valid) {
    throw new Error('Invalid session');
  }
  const us = await usersController.getMe({ address: verified.parsedJWT.sub });

  console.debug('🚀 ~ layout.tsx:44 ~ us:', us);

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
              {children}
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
