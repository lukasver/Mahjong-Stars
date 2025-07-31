import { metadata } from '@/common/config/site';
import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/og/*'],
      disallow: ['/api/*', '/admin/*'],
    },
    sitemap: `${metadata.siteUrl}/sitemap.xml`,
    host: metadata.siteUrl,
  };
}
