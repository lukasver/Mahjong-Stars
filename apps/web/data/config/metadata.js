const VERCEL_URL =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

const domain =
  VERCEL_URL ||
  process.env.NEXT_PUBLIC_DOMAIN?.split('://')?.[1] ||
  'mahjongstars.com';

const siteUrl = `http${process.env.NODE_ENV === 'development' ? '' : 's'
  }://${domain}`;

const metadata = {
  title: 'Mahjong Stars',
  description: 'Mahjong with AI Characters & NFT Rewards. Play & train AI avatars, collect unique characters, and earn $TILE. Multiplayer global platform with tournaments',
  domain,
  logoTitle: 'Mahjong Stars',
  businessName: 'Mahjong Stars',
  siteUrl,
  siteRepo: '',
  socialBanner: '/api/og',
  tokenSymbol: 'TILE',
  tokenName: 'TILES',
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

module.exports = { metadata };
