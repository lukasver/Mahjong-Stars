import { publicUrl } from './env';

const metadata = {
  title: '$MJS Token – Powering the Mahjong Stars Ecosystem',
  description:
    '$MJS is the core utility token of Mahjong Stars, enabling NFT trading, AI upgrades, tournament access, and revenue staking. Participate in a multi-billion dollar Web3 opportunity and fuel the first global social mahjong platform with real-world value and AI liquidity.',
  domain: 'mahjongstars.xyz',
  logoTitle: 'Mahjong Stars',
  businessName: 'Mahjong Stars',
  siteUrl: publicUrl,
  siteRepo: '',
  socialBanner: '/api/og',
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@mahjongstars.com',
  twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || '',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_HANDLE || '',
  discord: process.env.NEXT_PUBLIC_DISCORD_INVITE || '',
  github: process.env.NEXT_PUBLIC_GITHUB_URL || '',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
  threads: process.env.NEXT_PUBLIC_THREADS_URL || '',
  mastodon: process.env.NEXT_PUBLIC_MASTODON_URL || '',
  author: 'WASABI GAMES DMCC',
  language: 'en',
  theme: 'system',
  locale: 'en',
};

const getFooterLinks = (t: (k: string) => string) => {
  return [
    { href: '/web', title: t('Footer.links.home') },
    { href: '/docs', title: t('Footer.links.docs') },
    { href: '/web/about', title: t('Footer.links.whoWeAre') },
    { href: '/web/terms', title: t('Footer.links.termsAndConditions') },
    { href: '/web/privacy', title: t('Footer.links.privacyPolicy') },
    { href: '/web/contact', title: t('Footer.links.contact') },
  ];
};

export { metadata, getFooterLinks };
