/**
 * Profile details types for different authentication providers
 * Based on Thirdweb profile data structures
 */

// Base profile types
export type ProfileType =
	| "google"
	| "apple"
	| "facebook"
	| "discord"
	| "line"
	| "x"
	| "tiktok"
	| "coinbase"
	| "farcaster"
	| "telegram"
	| "github"
	| "twitch"
	| "steam"
	| "guest"
	| "backend"
	| "email"
	| "phone"
	| "passkey"
	| "wallet"
	| "siwe";

// Google OAuth profile details
export interface GoogleProfileDetails {
	email: string;
	hd: string; // hosted domain
	id: string;
	name: string;
	picture: string;
	givenName: string;
	familyName: string;
	emailVerified: boolean;
}

// Apple OAuth profile details
export interface AppleProfileDetails {
	id: string;
	name?: string;
	email?: string;
	emailVerified?: boolean;
}

// Facebook OAuth profile details
export interface FacebookProfileDetails {
	id: string;
	name?: string;
	email?: string;
	picture?: string;
	emailVerified?: boolean;
}

// Discord OAuth profile details
export interface DiscordProfileDetails {
	id: string;
	username?: string;
	discriminator?: string;
	avatar?: string;
	email?: string;
	emailVerified?: boolean;
}

// Line OAuth profile details
export interface LineProfileDetails {
	id: string;
	displayName?: string;
	pictureUrl?: string;
	email?: string;
	emailVerified?: boolean;
}

// X (Twitter) OAuth profile details
export interface XProfileDetails {
	id: string;
	name: string;
	username: string;
	profileImageUrl: string;
	email?: string;
	emailVerified?: boolean;
}

// TikTok OAuth profile details
export interface TikTokProfileDetails {
	id: string;
	displayName?: string;
	avatarUrl?: string;
	email?: string;
	emailVerified?: boolean;
}

// Coinbase OAuth profile details
export interface CoinbaseProfileDetails {
	id: string;
	name: string;
	avatar: string;
	email?: string;
	emailVerified?: boolean;
}

// Farcaster profile details
export interface FarcasterProfileDetails {
	id: string;
	username?: string;
	displayName?: string;
	avatar?: string;
	email?: string;
	emailVerified?: boolean;
}

// Telegram profile details
export interface TelegramProfileDetails {
	id: string;
	username?: string;
	firstName?: string;
	lastName?: string;
	picture?: string;
	email?: string;
	emailVerified?: boolean;
}

// GitHub OAuth profile details
export interface GitHubProfileDetails {
	id: string;
	login: string;
	name?: string;
	avatar_url?: string;
	email?: string;
	emailVerified?: boolean;
}

// Twitch OAuth profile details
export interface TwitchProfileDetails {
	id: string;
	login: string;
	display_name?: string;
	profile_image_url?: string;
	email?: string;
	emailVerified?: boolean;
}

// Steam OAuth profile details
export interface SteamProfileDetails {
	id: string;
	personaname?: string;
	avatar?: string;
	email?: string;
	emailVerified?: boolean;
}

// Guest profile details (minimal)
export interface GuestProfileDetails {
	id: string;
}

// Backend profile details
export interface BackendProfileDetails {
	id: string;
	email?: string;
	emailVerified?: boolean;
}

// Email profile details
export interface EmailProfileDetails {
	id: string;
	email: string;
}

// Phone profile details
export interface PhoneProfileDetails {
	id: string;
	phoneNumber: string;
	phoneVerified: boolean;
}

// Passkey profile details
export interface PasskeyProfileDetails {
	id: string;
	algorithm: string;
	publicKey: string;
	credentialId: string;
}

// Wallet profile details
export interface WalletProfileDetails {
	id: string;
	address: string;
}

// SIWE (Sign-In with Ethereum) profile details
export interface SiweProfileDetails {
	id: string;
	address: string;
	message?: string;
	signature?: string;
}

// Union type for all profile details
export type ProfileDetails =
	| GoogleProfileDetails
	| AppleProfileDetails
	| FacebookProfileDetails
	| DiscordProfileDetails
	| LineProfileDetails
	| XProfileDetails
	| TikTokProfileDetails
	| CoinbaseProfileDetails
	| FarcasterProfileDetails
	| TelegramProfileDetails
	| GitHubProfileDetails
	| TwitchProfileDetails
	| SteamProfileDetails
	| GuestProfileDetails
	| BackendProfileDetails
	| EmailProfileDetails
	| PhoneProfileDetails
	| PasskeyProfileDetails
	| WalletProfileDetails
	| SiweProfileDetails;

// Type guards for profile details
export const isGoogleProfileDetails = (
	details: ProfileDetails,
): details is GoogleProfileDetails => {
	return (
		"id" in details &&
		"email" in details &&
		"familyName" in details &&
		"givenName" in details &&
		"emailVerified" in details
	);
};

export const isXProfileDetails = (
	details: ProfileDetails,
): details is XProfileDetails => {
	return "username" in details && "profileImageUrl" in details;
};

export const isCoinbaseProfileDetails = (
	details: ProfileDetails,
): details is CoinbaseProfileDetails => {
	return "avatar" in details && "name" in details;
};

export const isTelegramProfileDetails = (
	details: ProfileDetails,
): details is TelegramProfileDetails => {
	return "firstName" in details && "picture" in details;
};

export const isPasskeyProfileDetails = (
	details: ProfileDetails,
): details is PasskeyProfileDetails => {
	return (
		"algorithm" in details &&
		"publicKey" in details &&
		"credentialId" in details
	);
};

export const isWalletProfileDetails = (
	details: ProfileDetails,
): details is WalletProfileDetails => {
	return "address" in details;
};

export const isEmailProfileDetails = (
	details: ProfileDetails,
): details is EmailProfileDetails => {
	return (
		"email" in details && "id" in details && Object.keys(details).length === 2
	);
};

export const isGuestProfileDetails = (
	details: ProfileDetails,
): details is GuestProfileDetails => {
	return Object.keys(details).length === 1 && "id" in details;
};

// Helper type to extract email and verification status
export interface EmailVerificationResult {
	email: string | null;
	emailVerified: boolean;
	image?: string;
	firstName?: string;
	lastName?: string;
}
