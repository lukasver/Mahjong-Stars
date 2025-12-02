import { ActiveLinkProvider } from '../hooks/use-active-link';
import { SiteConfig } from '../lib/types';
import { cn } from '../lib/utils';
import ActiveLink from './active-link';
import { SocialFooter } from './socials';

export const Footer = ({
  className,
  links,
  copyright,
  siteConfig,
  children,
  element,
}: {
  className?: string;
  links: { href: string; title: string; prefetch?: boolean }[];
  copyright: React.ReactNode;
  siteConfig: SiteConfig;
  children?: React.ReactNode;
  element?: 'footer' | 'div';
}) => {
  const El = element || 'footer';

  return (
    <El className={cn('mt-auto w-full', className)} role={El === 'footer' ? 'contentinfo' : undefined}>
      <div
        className={cn(
          'flex flex-col gap-4 justify-between items-center w-full md:my-10 p-6'
        )}
      >
        <nav className='w-full flex flex-col md:flex-row justify-between gap-6 mt-12 p-6 max-w-full container-wide'>
          <ActiveLinkProvider>
            <ul className='space-y-2'>
              {links.map((link) => (
                <li key={link.title}>
                  <ActiveLink
                    prefetch={link.prefetch}
                    href={link.href}
                    className={
                      'nav-link text-xl md:text-3xl text-white dark:text-white font-common font-medium'
                    }
                    activeClassName={'nav-link-active'}
                  >
                    <span>{link.title}</span>
                  </ActiveLink>
                </li>
              ))}
            </ul>
          </ActiveLinkProvider>
          {children && <div>{children}</div>}
        </nav>
      </div>

      <div className={'mx-auto container-wide px-6 sm:px-0'}>
        <BottomBar siteConfig={siteConfig} copyright={copyright} />
      </div>
      {/*  <div>

        <hr
          className='w-full my-4 border-0 bg-linear-to-r from-white/5 via-black/10 to-white/5 dark:from-black/5 dark:via-white/30 darK:to-black/5'
          style={{ height: '1px' }}
        />

        <div className='py-8 px-2 flex flex-col items-center'>
      <SocialFooter config={siteConfig} />
      <div className='w-full text-center lg:flex lg:justify-center p-4 mb-2 space-x-2 text-sm text-gray-500 dark:text-gray-400'>
        <span>{copyright}</span>
      </div>
    </div> 
      </div>*/}
    </El>
  );
};

const BottomBar = ({
  siteConfig,
  copyright,
}: {
  siteConfig: SiteConfig;
  copyright: React.ReactNode;
}) => {
  return (
    <div className='py-8 px-2 flex flex-col sm:flex-row sm:items-center'>
      <div className='flex-1 text-left p-4 mb-2 space-x-2 text-sm text-white'>
        <p className='text-base sm:text-2xl font-common font-medium'>
          {copyright}
        </p>
      </div>
      <SocialFooter config={siteConfig} className='shrink-0 px-4' />
    </div>
  );
};
