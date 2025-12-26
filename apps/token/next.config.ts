import bundleAnalyzer from "@next/bundle-analyzer";
import { type NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { publicUrl } from "./common/config/env";

const BUNDLE_ANALIZER_ON = process.env.ANALYZE === "true";

const CRYPTO_NODES = {
	mainnet: `wss://eth-mainnet.g.alchemy.com https://eth-mainnet.g.alchemy.com`,
	sepolia: `wss://eth-sepolia.g.alchemy.com https://eth-sepolia.g.alchemy.com`,
	goerli: `wss://eth-goerli.g.alchemy.com https://eth-goerli.g.alchemy.com`,
	polygon: `wss://polygon-mainnet.g.alchemy.com https://polygon-mainnet.g.alchemy.com`,
	mumbai: `wss://polygon-mumbai.g.alchemy.com https://polygon-mumbai.g.alchemy.com`,
};

const CRYPTO_NODES_CSP = Object.values(CRYPTO_NODES).join(" ");
const WALLETS_CSP = `wss://*.walletconnect.org wss://*.walletconnect.com https://*.walletconnect.org https://*.walletconnect.com https://*.thirdweb.com`;
const EXTERNAL_PROVIDERS = `min-api.cryptocompare.com`;
const ANALYTICS_PROVIDERS = `https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.posthog.com`;
const GOOGLE_CSP = `https://fonts.googleapis.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha https://www.google.com/recaptcha/enterprise.js https://www.gstatic.com/recaptcha/releases/`;
const STORAGE_CSP = `https://storage.googleapis.com`;
const VERCEL_LIVE_CSP = `https://vercel.live`;
const HELIO_SCRIPT = `https://embed.hel.io/assets/index-v1.js`;
const HELIO_STYLES = `https://embed.hel.io/assets/index-v1.css`;
const HELIO_API = `https://api.hel.io/v1/ https://tiplink.io/api/wallet_adapter_ancestors/ https://quaint-convincing-choice.base-mainnet.quiknode.pro/c2ba2df1f23952da94da9e0cd0a5f8d8d028a91a/`;
const HELIO_ASSETS = `https://helio-assets.s3.eu-west-1.amazonaws.com/`;
const MAIN_DOMAIN =
	process.env.NODE_ENV === "production"
		? `https://*.thetilescompany.io ${publicUrl}`
		: `https://*.thetilescompany.io https://*.vercel.app http://localhost:3000 http://localhost:8080 http://127.0.0.1:7242`
const E_SIGN_DOMAIN = `https://*.documenso.com/`;

const UPGRADE_INSECURE_REQUESTS =
	process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : "";

const INSTAXCHANGE_FRAME = `https://instaxchange.banxa.com https://instaxchange.com https://*.instaxchange.com`;
const INSTAXCHANGE_CONNECT = `https://instaxchange.com https://api.instaxchange.com https://*.instaxchange.com`;


const cspHeader = `
    default-src 'self' ${MAIN_DOMAIN};
    connect-src 'self' ${INSTAXCHANGE_CONNECT} ${HELIO_API} ${MAIN_DOMAIN} ${ANALYTICS_PROVIDERS} ${EXTERNAL_PROVIDERS} ${WALLETS_CSP} ${CRYPTO_NODES_CSP} ${E_SIGN_DOMAIN} ${STORAGE_CSP} https://ipfscdn.io https://*.ipfscdn.io ${VERCEL_LIVE_CSP} https://*.google.com https://google.com/pay https://apple.com https://www.apple.com;
    frame-src 'self' ${INSTAXCHANGE_FRAME} https://*.walletconnect.org https://*.walletconnect.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha https://*.thirdweb.com/ https://vercel.live/;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' ${ANALYTICS_PROVIDERS} ${GOOGLE_CSP} ${E_SIGN_DOMAIN} ${VERCEL_LIVE_CSP} ${HELIO_SCRIPT};
    worker-src 'self' blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${HELIO_STYLES};
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: ${MAIN_DOMAIN} https://*.gstatic.com https://pay.google.com https://rainbowme-res.cloudinary.com/ https://*.ipfscdn.io https://*.walletconnect.org https://*.walletconnect.com https://storage.googleapis.com https://i.ibb.co ${HELIO_SCRIPT} ${HELIO_ASSETS};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' *.thirdweb.com;
    block-all-mixed-content;
    ${UPGRADE_INSECURE_REQUESTS}
`;

const config: NextConfig = () => {
	const plugins = [
		bundleAnalyzer({
			enabled: BUNDLE_ANALIZER_ON,
		}),
		createNextIntlPlugin("./lib/i18n.ts"),
	];
	return plugins.reduce((acc, next) => next(acc), {
		reactStrictMode: false, // process.env.NODE_ENV === "development",
		async headers() {
			return [
				{
					source: "/(.*)",
					headers: [
						{
							key: "Content-Security-Policy",
							value: cspHeader.replace(/\n/g, ""),
						},
						{
							key: "Permissions-Policy",
							value: `payment=(self "https://instaxchange.banxa.com" "https://instaxchange.com" "https://*.instaxchange.com")`,
						},
					],
				},
			];
		},

		images: {
			remotePatterns: [
				{
					protocol: "https",
					hostname: "*.ipfscdn.io",
				},
				{
					protocol: "https",
					hostname: "storage.googleapis.com",
					pathname: "/mjs-public/**",
				},
				{
					protocol: "https",
					hostname: "storage.googleapis.com",
					pathname: "/mjs-public-dev/**",
				},
				{
					protocol: "https",
					hostname: "storage.googleapis.com",
					pathname: "/mjs-private/**",
				},
				{
					protocol: "https",
					hostname: "storage.googleapis.com",
					pathname: "/mjs-private-dev/**",
				},
			],
		},
		experimental: {
			optimizePackageImports: ["@mjs/ui"],
		},
		typedRoutes: true,
		compiler: {
			// Automatically remove console.* other than 'error' & 'info' in production,
			...(process.env.NODE_ENV !== "development" &&
				!!process.env.VERCEL && {
				removeConsole: {
					exclude: ["error", "info", "debug", "warn"],
				},
			}),
			// Only remove for vercel deployments that are not tests environment
			reactRemoveProperties: !!process.env.VERCEL && process.env.NODE_ENV === 'production' &&
				process.env.VERCEL_TARGET_ENV !== 'tests' && {
				properties: ["^data-testid$"],
			}
		},
		logging: {
			fetches: {
				fullUrl: process.env.VERCEL_URL ? false : true,
			},
		},
		async redirects() {
			return [
				{
					source: "/web/:path*",
					destination: `${process.env.NEXT_PUBLIC_LANDING_PAGE_DOMAIN!}/:path*`,
					permanent: process.env.NODE_ENV === "production",
				},
				{
					source: "/:locale*/web/:path*",
					destination: `${process.env
						.NEXT_PUBLIC_LANDING_PAGE_DOMAIN!}/:locale*/:path*`,
					permanent: process.env.NODE_ENV === "production",
				},
				{
					source: "/docs/:path*",
					destination: `${process.env.NEXT_PUBLIC_DOCS_DOMAIN!}/:path*`,
					permanent: process.env.NODE_ENV === "production",
				},
				{
					source: "/:locale*/docs/:path*",
					destination: `${process.env
						.NEXT_PUBLIC_DOCS_DOMAIN!}/:locale*/:path*`,
					permanent: process.env.NODE_ENV === "production",
				},
			];
		},
		// productionBrowserSourceMaps: !!(process.env.NODE_ENV === "production"),
		// fixes wallet connect dependency issue https://docs.walletconnect.com/web3modal/nextjs/about#extra-configuration
		webpack: (config) => {
			config.externals.push("pino-pretty", "lokijs", "encoding");

			// https://github.com/handlebars-lang/handlebars.js/issues/953#issuecomment-239874313
			config.resolve.alias = {
				...config.resolve.alias,
				handlebars: "handlebars/dist/handlebars.js",
			};
			return config;
		},
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
			]
		},
		skipTrailingSlashRedirect: true,


	} as NextConfig);
};

export default config;
