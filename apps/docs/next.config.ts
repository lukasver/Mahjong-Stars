import type { NextConfig } from 'next';
import nextra from 'nextra';
import { i18n } from './lib/i18n';

const withNextra = nextra({
  search: { codeblocks: false },
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: { exclude: ['error', 'warn', 'debug', 'info'] },
  },
  i18n: i18n,
  transpilePackages: ['@mjs/ui'],

  experimental: {
    scrollRestoration: true,
    viewTransition: true,
  },
  // PostHog rewrites to proxy ingest requests
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/web/:path*',
        destination: `${process.env.NEXT_PUBLIC_LANDING_PAGE_DOMAIN!}/:path*`,
        permanent: process.env.NODE_ENV === 'production',
      },
      {
        source: '/docs/:path*',
        destination: `${process.env.NEXT_PUBLIC_DOCS_DOMAIN!}/:path*`,
        permanent: process.env.NODE_ENV === 'production',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default () => {
  const plugins = [withNextra];

  return plugins.reduce((acc, next) => next(acc), nextConfig);
};
