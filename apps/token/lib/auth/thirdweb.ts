import "server-only";
import { createThirdwebClient, getUser } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import { refreshJWT as refreshJWTUtils } from "thirdweb/utils";
import { Profile, privateKeyToAccount } from "thirdweb/wallets";
import { JWT_EXPIRATION_TIME } from "@/common/config/constants";
import { env, publicUrl } from "@/common/config/env";
import { LoginParams } from "../actions";

import {
	EmailVerificationResult,
	isCoinbaseProfileDetails,
	isEmailProfileDetails,
	isGoogleProfileDetails,
	isTelegramProfileDetails,
	isXProfileDetails,
	ProfileDetails,
} from "../types/profile-details";

// secretKey for serverside usage, wont be available in client
export const serverClient = createThirdwebClient({
	secretKey: env.THIRDWEB_API_SECRET,
	teamId: env.THIRDWEB_TEAM_ID,
	clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

const auth = createAuth({
	domain: publicUrl,
	client: serverClient,
	// PK of dedicated account used for authentication purposes
	adminAccount: privateKeyToAccount({
		client: serverClient,
		privateKey: env.THIRDWEB_ADMIN_PRIVATE_KEY,
	}),
	jwt: {
		// One day
		expirationTimeSeconds: JWT_EXPIRATION_TIME,
	},
	// login: {
	//   payloadExpirationTimeSeconds: Duration.fromObject({ days: 1 }).as(
	//     'seconds'
	//   ),
	//   uri: publicUrl,
	// },
});

export const generateAuthPayload = async ({
	address,
	chainId,
}: {
	address: string;
	chainId: number;
}) => {
	return auth.generatePayload({ address, chainId });
};

export const verifyAuthPayload = async (payload: LoginParams) => {
	return auth.verifyPayload(payload);
};

export const verifyJwt = async (jwt: string) => {
	return auth.verifyJWT({ jwt });
};

export const generateJWT = async (
	payload: Extract<
		Awaited<ReturnType<typeof verifyAuthPayload>>,
		{ valid: true }
	>["payload"],
	ctx?: Record<string, string>,
) => {
	return auth.generateJWT({ payload, context: ctx });
};

//Todo should check if is ok to use the admin account.
export const refreshJWT = async (jwt: string) => {
	return await refreshJWTUtils({
		account: privateKeyToAccount({
			client: serverClient,
			privateKey: env.THIRDWEB_ADMIN_PRIVATE_KEY,
		}),
		jwt,
		expirationTime: JWT_EXPIRATION_TIME,
	});
};

export const getUserFromAddress = async (address: string) => {
	return await getUser({ client: serverClient, walletAddress: address }).catch(
		() => null,
	);
};

// Utility function to extract email verification from profile details
export const extractEmailVerification = (
	profiles: Profile[] | undefined,
): EmailVerificationResult | null => {
	const p = profiles?.find((d) => d.details);

	if (!p || !p.details) {
		return null;
	}

	const details = p.details as unknown as ProfileDetails;

	switch (p.type) {
		case "email": {
			// Default case for TW email, we default to verified since its done through them
			if (isEmailProfileDetails(details)) {
				return {
					email: details.email,
					emailVerified: true,
				};
			}
			break;
		}
		case "google": {
			if (isGoogleProfileDetails(details)) {
				return {
					email: details.email,
					emailVerified: details.emailVerified,
					image: details.picture,
					firstName: details.givenName,
					lastName: details.familyName,
				};
			}
			break;
		}
		case "telegram": {
			if (isTelegramProfileDetails(details)) {
				return {
					email: null,
					emailVerified: false,
					image: details.picture,
					firstName: details.firstName,
					lastName: details.lastName,
				};
			}
			break;
		}
		case "coinbase": {
			if (isCoinbaseProfileDetails(details)) {
				return {
					email: null,
					emailVerified: false,
					image: details.avatar,
					firstName: details.name?.split(" ")[0],
					lastName: details.name?.split(" ")[1],
				};
			}
			break;
		}
		case "x": {
			if (isXProfileDetails(details)) {
				return {
					email: null,
					emailVerified: false,
					image: details.profileImageUrl,
					firstName: details.name?.split(" ")[0],
					lastName: details.name?.split(" ")[1],
				};
			}
			break;
		}
		default: {
			// For other OAuth providers, check if they have email and assume verified
			if ("email" in details && details.email) {
				return {
					email: details.email,
					emailVerified: true,
				};
			}
			break;
		}
	}

	return null;
};
