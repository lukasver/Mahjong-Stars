import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const VERCEL_TARGET_ENV = process.env.VERCEL_TARGET_ENV;

/**
 * Determines the public URL for the application based on the deployment environment.
 *
 * When deploying to Vercel:
 * - For production and staging environments, uses the custom domain defined in NEXT_PUBLIC_DOMAIN
 * - For preview deployments, uses the auto-generated Vercel URL
 * - For other environments, tries NEXT_PUBLIC_DOMAIN first, falling back to Vercel URL
 *
 * @returns {string | undefined} The public URL to use for the application
 */
const getPublicUrl = () => {
	if (process.env.VERCEL) {
		const vercelUrl = `https://${process.env.VERCEL_URL}`;
		switch (VERCEL_TARGET_ENV) {
			case "production":
				return process.env.NEXT_PUBLIC_DOMAIN ||
					process.env.VERCEL_PROJECT_PRODUCTION_URL
					? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
					: vercelUrl;
			case "preview":
				return process.env.NEXT_PUBLIC_DOMAIN || vercelUrl;
			case "tests":
				return `https://mjs-token-git-tests-smat-sa.vercel.app`;
			default:
				return process.env.NEXT_PUBLIC_DOMAIN || vercelUrl;
		}
	}
	return process.env.NEXT_PUBLIC_DOMAIN!;
};

export const env = createEnv({
	server: {
		DOCUMENSO_WEBHOOK_API_KEY: z.string().min(1),
		DATABASE_URL: z.string().min(1),
		IS_PRODUCTION: z.boolean(),
		IS_DEV: z.boolean(),
		IS_TEST: z.boolean(),
		DEBUG: z.preprocess(
			(val) => val === "true" || val === "1",
			z.boolean().optional().default(false),
		),
		EMAIL_API_KEY: z.string().min(1),
		EMAIL_FROM: z.string().min(1),
		THIRDWEB_ADMIN_PRIVATE_KEY: z.string().min(1),
		THIRDWEB_SERVER_WALLET_ADDRESS: z.string().min(1),
		THIRDWEB_API_SECRET: z.string().min(1),
		THIRDWEB_TEAM_ID: z.string().min(1),
		DOCUMENSO_API_KEY: z.string().min(1),
		EXCHANGE_RATES_API_URL: z.string().url().min(1),
		EXCHANGE_RATES_API_KEY: z.string().min(1),
		EXCHANGE_RATES_API_URL_BACKUP: z.string().url().min(1).optional(),
		EXCHANGE_RATES_API_KEY_BACKUP: z.string().min(1).optional(),
		MAGIC_WORD: z.string().min(1).optional(),
		PDF_WEBHOOK_API_KEY: z.string().min(1),
		PDF_SERVICE_URL: z.string().min(1),
		PDF_SERVICE_API_KEY: z.string().min(1),
		PUBLIC_BUCKET: z.string().min(1),
		PRIVATE_BUCKET: z.string().min(1),
		GCP_SERVICE_ACCOUNT: z.string().min(1),
		GCP_PROJECT_ID: z.string().min(1),
		EMAIL_OCTOPUS_LIST_ID: z.string().min(1),
		EMAIL_OCTOPUS_API_KEY: z.string().min(1),
		JWT_SECRET: z.string().min(1),
		CRON_SECRET: z.string().min(1),
		INSTAXCHANGE_API_KEY: z.string().min(1).optional(),
		INSTAXCHANGE_API_URL: z.string().url().min(1).optional(),
		INSTAXCHANGE_WEBHOOK_SECRET: z.string().min(1).optional(),
		INSTAXCHANGE_ACCOUNT_REF_ID: z.string().min(1).optional(),
	},
	client: {
		NEXT_PUBLIC_THIRDWEB_CLIENT_ID: z.string().min(1),
		NEXT_PUBLIC_DOMAIN: z.string().url().optional(),
		NEXT_PUBLIC_LANGUAGE: z.string().optional().default("en"),
		NEXT_PUBLIC_DEBUG: z.preprocess(
			(val) => val === "true" || val === "1",
			z.boolean().optional().default(false),
		),
		NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1),
		NEXT_PUBLIC_MAIN_WALLET: z.string().min(1),
		NEXT_PUBLIC_BUCKET_PUBLIC_URL: z.string().url().min(1),
		NEXT_PUBLIC_CLEAR_STORAGE_ON_DEPLOYMENT: z.preprocess(
			(val) => val === "true" || val === "1",
			z.boolean().optional().default(false),
		),
		NEXT_PUBLIC_DEPLOYMENT_ID: z.string().optional(),
		NEXT_PUBLIC_SPONSOR_GAS_FEES: z.preprocess(
			(val) => val === "true" || val === "1",
			z.boolean().optional().default(false),
		),
	},
	runtimeEnv: {
		DOCUMENSO_WEBHOOK_API_KEY: process.env.DOCUMENSO_WEBHOOK_API_KEY,
		DATABASE_URL: process.env.DATABASE_URL,
		NEXT_PUBLIC_DOMAIN: getPublicUrl(),
		NEXT_PUBLIC_LANGUAGE: process.env.NEXT_PUBLIC_LANGUAGE,
		NEXT_PUBLIC_DEBUG: process.env.DEBUG, // Same as DEBUG
		NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
			process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
		NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
		NEXT_PUBLIC_MAIN_WALLET: process.env.NEXT_PUBLIC_MAIN_WALLET,
		NEXT_PUBLIC_CLEAR_STORAGE_ON_DEPLOYMENT:
			process.env.NEXT_PUBLIC_CLEAR_STORAGE_ON_DEPLOYMENT,
		NEXT_PUBLIC_DEPLOYMENT_ID: process.env.NEXT_PUBLIC_DEPLOYMENT_ID,
		IS_PRODUCTION: process.env.NODE_ENV === "production" || VERCEL_TARGET_ENV === "production",
		IS_DEV: process.env.NODE_ENV === "development",
		IS_TEST: process.env.NODE_ENV === "test" || VERCEL_TARGET_ENV === "tests",
		DEBUG: process.env.DEBUG,
		EMAIL_API_KEY: process.env.EMAIL_API_KEY,
		EMAIL_FROM: process.env.EMAIL_FROM,
		THIRDWEB_ADMIN_PRIVATE_KEY: process.env.THIRDWEB_ADMIN_PRIVATE_KEY,
		THIRDWEB_SERVER_WALLET_ADDRESS: process.env.THIRDWEB_SERVER_WALLET_ADDRESS,
		THIRDWEB_API_SECRET: process.env.THIRDWEB_API_SECRET,
		THIRDWEB_TEAM_ID: process.env.THIRDWEB_TEAM_ID,
		DOCUMENSO_API_KEY: process.env.DOCUMENSO_API_KEY,
		EXCHANGE_RATES_API_URL: process.env.EXCHANGE_RATES_API_URL,
		EXCHANGE_RATES_API_KEY: process.env.EXCHANGE_RATES_API_KEY,
		EXCHANGE_RATES_API_URL_BACKUP: process.env.EXCHANGE_RATES_API_URL_BACKUP,
		EXCHANGE_RATES_API_KEY_BACKUP: process.env.EXCHANGE_RATES_API_KEY_BACKUP,
		NEXT_PUBLIC_BUCKET_PUBLIC_URL: process.env.NEXT_PUBLIC_BUCKET_PUBLIC_URL,
		MAGIC_WORD: process.env.MAGIC_WORD,
		PDF_WEBHOOK_API_KEY: process.env.PDF_WEBHOOK_API_KEY,
		PDF_SERVICE_URL: process.env.PDF_SERVICE_URL,
		PDF_SERVICE_API_KEY: process.env.PDF_SERVICE_API_KEY,
		PUBLIC_BUCKET: process.env.PUBLIC_BUCKET,
		PRIVATE_BUCKET: process.env.PRIVATE_BUCKET,
		GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
		GCP_SERVICE_ACCOUNT: process.env.GCP_SERVICE_ACCOUNT,
		EMAIL_OCTOPUS_LIST_ID: process.env.EMAIL_OCTOPUS_LIST_ID,
		EMAIL_OCTOPUS_API_KEY: process.env.EMAIL_OCTOPUS_API_KEY,
		JWT_SECRET: process.env.JWT_SECRET,
		CRON_SECRET: process.env.CRON_SECRET,
		NEXT_PUBLIC_SPONSOR_GAS_FEES: process.env.NEXT_PUBLIC_SPONSOR_GAS_FEES,
		INSTAXCHANGE_API_KEY: process.env.INSTAXCHANGE_API_KEY,
		INSTAXCHANGE_API_URL: process.env.INSTAXCHANGE_API_URL,
		INSTAXCHANGE_WEBHOOK_SECRET: process.env.INSTAXCHANGE_WEBHOOK_SECRET,
		INSTAXCHANGE_ACCOUNT_REF_ID: process.env.INSTAXCHANGE_ACCOUNT_REF_ID,
	},
	skipValidation: process.env.NODE_ENV === "test",
});

//Cannot do this with serverside variables
const _publicUrl = env.NEXT_PUBLIC_DOMAIN;

if (!_publicUrl) {
	throw new Error("Missing NEXT_PUBLIC_DOMAIN");
}

// force type inference to string
const publicUrl = _publicUrl;
export { publicUrl };
