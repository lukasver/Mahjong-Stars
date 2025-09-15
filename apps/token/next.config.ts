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
const ANALYTICS_PROVIDERS = `eu.posthog.com`;
const GOOGLE_CSP = `https://fonts.googleapis.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha https://www.google.com/recaptcha/enterprise.js https://www.gstatic.com/recaptcha/releases/`;
const STORAGE_CSP = `https://storage.googleapis.com`;
const MAIN_DOMAIN =
	process.env.NODE_ENV === "production"
		? `https://*.mahjongstars.com ${publicUrl}`
		: `https://*.mahjongstars.com https://*.vercel.app http://localhost:3000`;
const E_SIGN_DOMAIN = `https://*.documenso.com/`;

const cspHeader = `
    default-src 'self' ${MAIN_DOMAIN};
    connect-src 'self' ${MAIN_DOMAIN} ${ANALYTICS_PROVIDERS} ${EXTERNAL_PROVIDERS} ${WALLETS_CSP} ${CRYPTO_NODES_CSP} ${E_SIGN_DOMAIN} ${STORAGE_CSP};
    frame-src 'self' https://*.walletconnect.org https://*.walletconnect.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha https://*.adobesign.com https://*.thirdweb.com/;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' ${ANALYTICS_PROVIDERS} ${GOOGLE_CSP} ${E_SIGN_DOMAIN};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: ${MAIN_DOMAIN} https://*.ipfscdn.io https://*.walletconnect.org https://*.walletconnect.com https://storage.googleapis.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' *.calendly.com *.thirdweb.com;
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

const config: NextConfig = () => {
	const plugins = [
		bundleAnalyzer({
			enabled: BUNDLE_ANALIZER_ON,
		}),
		createNextIntlPlugin("./lib/i18n.ts"),
	];
	return plugins.reduce((acc, next) => next(acc), {
		reactStrictMode: true,
		async headers() {
			return [
				{
					source: "/(.*)",
					headers: [
						{
							key: "Content-Security-Policy",
							value: cspHeader.replace(/\n/g, ""),
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
		compiler: {
			// Automatically remove console.* other than 'error' & 'info' in production,
			...(process.env.NODE_ENV !== "development" && {
				removeConsole: {
					exclude: ["error", "info", "debug", "warn"],
				},
			}),
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
	} as NextConfig);
};

export default config;
