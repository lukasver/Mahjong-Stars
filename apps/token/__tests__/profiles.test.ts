import { getUser } from "thirdweb";
import { describe, expect, test, vi } from "vitest";
import { extractEmailVerification, serverClient } from "@/lib/auth/thirdweb";
import {
	CoinbaseProfileDetails,
	EmailProfileDetails,
	GoogleProfileDetails,
	GuestProfileDetails,
	isCoinbaseProfileDetails,
	isEmailProfileDetails,
	isGoogleProfileDetails,
	isGuestProfileDetails,
	isPasskeyProfileDetails,
	isTelegramProfileDetails,
	isWalletProfileDetails,
	isXProfileDetails,
	PasskeyProfileDetails,
	TelegramProfileDetails,
	WalletProfileDetails,
	XProfileDetails,
} from "@/lib/types/profile-details";

vi.mock("server-only", () => {
	return {};
});

const authOptions = [
	"google",
	"apple",
	"facebook",
	"discord",
	"line",
	"x",
	"tiktok",
	"coinbase",
	"farcaster",
	"telegram",
	"github",
	"twitch",
	"steam",
	"guest",
	"backend",
	"email",
	"phone",
	"passkey",
	"wallet",
	"siwe",
] as const;

/**
 * Test suite for currency formatting utilities
 */
describe("Thirdweb profiles", () => {
	const ADDRESSES = {
		email: "0xA2A50640ac264acd9B0B171c12FC18efB1561975",
		guest: "0x1513BC3B37e02D98fcECe4997671D726Fc27D90e",
		siwe: "0x74a21bA7bd5B2Ced78d234373F03877F98919e1F",
		google: "0xc5278119e30d2F915301b027C1f2Dd5CB1432d12",
		passkey: "0xB2733AE9B4435883a3F6BE2498F239a6aD6A0eEF",
		coinbase: "0x3a01f63b124053BD2Ca358397855721587a49a3b",
		x: "0x0F5672E421Af52f5c01f44814f8BdC0B2564f4ac",
		telegram: "0x8b0C6b6295BEb7527A2A7F2dFCFB196B56C930Ad",
	} as { [K in (typeof authOptions)[number]]: string };
	test("Should parse profiles to check if email is verified", async () => {
		for (const option of authOptions) {
			const wallet = ADDRESSES[option];
			if (!wallet) {
				continue;
			}

			const user = await getUser({
				client: serverClient,
				walletAddress: wallet,
			});
			const res = extractEmailVerification(user?.profiles);

			expect(res).toBeDefined();

			if (option === "email") {
				expect(res).toHaveProperty("email");
				expect(res).toHaveProperty("emailVerified", true);
			}
			if (option === "google") {
				expect(res).toHaveProperty("firstName");
				expect(res).toHaveProperty("lastName");
				expect(res).toHaveProperty("email");
				expect(res).toHaveProperty("emailVerified", true);
			}
			if (option === "telegram") {
				expect(res).toHaveProperty("firstName");
				expect(res).toHaveProperty("lastName", undefined);
				expect(res).toHaveProperty("image");
				expect(res).toHaveProperty("email", null);
				expect(res).toHaveProperty("emailVerified", false);
			}
			if (option === "coinbase") {
				expect(res).toHaveProperty("firstName");
				expect(res).toHaveProperty("lastName");
				expect(res).toHaveProperty("image");
				expect(res).toHaveProperty("email", null);
				expect(res).toHaveProperty("emailVerified", false);
			}
			if (option === "x") {
				expect(res).toHaveProperty("firstName");
				expect(res).toHaveProperty("lastName");
				expect(res).toHaveProperty("image");
				expect(res).toHaveProperty("email", null);
				expect(res).toHaveProperty("emailVerified", false);
			}
		}
	});

	test("Should correctly identify profile types using type guards", () => {
		// Test Google profile type guard
		const googleDetails: GoogleProfileDetails = {
			email: "test@gmail.com",
			hd: "gmail.com",
			id: "123456789",
			name: "Test User",
			picture: "https://example.com/pic.jpg",
			givenName: "Test",
			familyName: "User",
			emailVerified: true,
		};
		expect(isGoogleProfileDetails(googleDetails)).toBe(true);

		// Test X profile type guard
		const xDetails: XProfileDetails = {
			id: "123456789",
			name: "Test User",
			username: "testuser",
			profileImageUrl: "https://example.com/pic.jpg",
		};
		expect(isXProfileDetails(xDetails)).toBe(true);

		// Test Coinbase profile type guard
		const coinbaseDetails: CoinbaseProfileDetails = {
			id: "123456789",
			name: "Test User",
			avatar: "https://example.com/pic.jpg",
		};
		expect(isCoinbaseProfileDetails(coinbaseDetails)).toBe(true);

		// Test Telegram profile type guard
		const telegramDetails: TelegramProfileDetails = {
			id: "123456789",
			firstName: "Test",
			picture: "https://example.com/pic.jpg",
		};
		expect(isTelegramProfileDetails(telegramDetails)).toBe(true);

		// Test Passkey profile type guard
		const passkeyDetails: PasskeyProfileDetails = {
			id: "123456789",
			algorithm: "ES256",
			publicKey: "test-key",
			credentialId: "test-credential",
		};
		expect(isPasskeyProfileDetails(passkeyDetails)).toBe(true);

		// Test Wallet profile type guard
		const walletDetails: WalletProfileDetails = {
			id: "0x123456789",
			address: "0x123456789",
		};
		expect(isWalletProfileDetails(walletDetails)).toBe(true);

		// Test Email profile type guard
		const emailDetails: EmailProfileDetails = {
			id: "123456789",
			email: "test@example.com",
		};
		expect(isEmailProfileDetails(emailDetails)).toBe(true);

		// Test Guest profile type guard
		const guestDetails: GuestProfileDetails = {
			id: "123456789",
		};
		expect(isGuestProfileDetails(guestDetails)).toBe(true);
	});
});
