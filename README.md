# Mahjong Stars monorepo

![MahjongStars banner](/banner.webp)

## What's inside?

This monorepo is a Turborepo which includes the following packages/apps:

### Apps and Packages

- `@mjs/docs`: an SSG [Next.js](https://nextjs.org/) app with [Tailwind CSS](https://tailwindcss.com/)
- `@mjs/token`: a [Next.js](https://nextjs.org/) app with [Tailwind CSS](https://tailwindcss.com/)
- `@mjs/web`: a SSG [Next.js](https://nextjs.org/) app with [Tailwind CSS](https://tailwindcss.com/)
- `@mjs/pdf-gen`: a container to run Puppeteer for PDF generation with webhook support
- `@mjs/ui`: an internal React component library with [Tailwind CSS](https://tailwindcss.com/) and [Shadcn/ui](https://ui.shadcn.com/)
- `@mjs/transactional`: a package containing transactional email templates shared by applications
- `@mjs/i18n`: a pkg that contains global and specific localized texts for apps
- `@mjs/utils`: a pkg that contains shared utilities and helper functions used throughout the monorepo
- ~~`@mjs/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)~~ Deprecated in favor of [Biome](https://biomejs.dev/)
- `@mjs/tailwind-config`: shared Tailwind CSS configuration used throughout the monorepo
- `@mjs/typescript-config`: `tsconfig.json`s used throughout the monorepo

### Live URLs

- [Mahjong Stars](https://www.mahjongstars.com) - Main website
- [Documentation](https://docs.mahjongstars.com) - Developer documentation
