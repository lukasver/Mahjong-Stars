import { createWallet, inAppWallet } from "thirdweb/wallets";
import { env } from "@/common/config/env";
import { metadata } from "@/common/config/site";
import MahjongStarsLogo from "@/public/static/images/logo-wt.webp";

export const wallets = [
	inAppWallet({
		auth: {
			options: [
				"google",
				"coinbase",
				"x",
				"telegram",
				// 'guest',
				"email",
				"passkey",
				"backend",
				// By using wallet here, we create Smart accounts even if the user logs in with a valid wallet
				// 'wallet',
			],
			redirectUrl: `${env.NEXT_PUBLIC_DOMAIN}/onboarding`,
			// passkeyDomain: env.NEXT_PUBLIC_DOMAIN,
			mode: "popup",
		},
		metadata: {
			name: metadata.businessName,
			image: {
				src: MahjongStarsLogo.src,
				height: MahjongStarsLogo.height,
				width: MahjongStarsLogo.width,
				alt: "Mahjong Stars Logo",
			},
			icon: `https://storage.googleapis.com/mjs-public/branding/icon-120x120.png`,
		},
	}),
	// If we use external wallets, we do not create Smart accounts when user logs in with a valid wallet, so we don't see its information in the thirdweb dashboard

	// createWallet('io.metamask'),
	createWallet("com.coinbase.wallet"),
	createWallet("me.rainbow"),
	createWallet("io.rabby"),
	// createWallet('io.zerion.wallet'),
];
