import "server-only";
import { waitUntil } from "@vercel/functions";
import { defineChain } from "thirdweb";
import { verifySignature } from "thirdweb/auth";
import { z } from "zod";
import { ROLES } from "@/common/config/constants";
import { prisma } from "@/db";
import { serverClient } from "./thirdweb";

/**
 * Schema for admin action payload
 */
export const AdminActionPayloadSchema = z.object({
	action: z.string(),
	timestamp: z.number(),
	saleId: z.string().optional(),
	data: z.record(z.unknown()).optional(),
});

export type AdminActionPayload = z.infer<typeof AdminActionPayloadSchema>;

// /**
//  * Generate a payload for admin action signature
//  */
// export const generateAdminActionPayload = async ({
//   action,
//   saleId,
//   data,
// }: {
//   action: string;
//   saleId?: string;
//   data?: Record<string, unknown>;
// }) => {
//   const payload: AdminActionPayload = {
//     action,
//     timestamp: Date.now(),
//     saleId,
//     data,
//   };

//   return auth.generatePayload({
//     address: '', // Will be filled by client
//     chainId: 56, // BSC mainnet
//     payload: JSON.stringify(payload),
//   });
// };

/**
 * Verify admin action signature and check permissions
 */
export const verifyAdminSignature = async ({
	payload,
	signature,
	address,
	chainId,
}: {
	payload: AdminActionPayload;
	signature: string;
	address: string;
	chainId: number;
}) => {
	const stringifiedPayload = JSON.stringify(payload);
	// Verify the signature
	const isValid = await verifySignature({
		signature,
		address,
		chain: defineChain(chainId),
		message: stringifiedPayload,
		client: serverClient,
	});

	if (!isValid) {
		throw new Error("Invalid signature");
	}

	// Check if payload is not expired (5 minutes)
	const now = Date.now();
	const payloadAge = now - payload.timestamp;
	const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

	if (payloadAge > fiveMinutes) {
		throw new Error("Signature expired");
	}

	// Check if user has admin role
	const user = await prisma.user.findUnique({
		where: {
			walletAddress: address,
			userRole: {
				some: {
					role: {
						name: {
							in: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
						},
					},
				},
			},
		},
		select: {
			id: true,
			walletAddress: true,
		},
	});

	if (!user) {
		throw new Error("User does not have admin privileges");
	}

	waitUntil(
		prisma.auditTrail.create({
			data: {
				actionType: payload.action,
				performerAddress: address,
				content: stringifiedPayload,
			},
		}),
	);

	return {
		valid: true,
		user,
		payload,
	};
};
