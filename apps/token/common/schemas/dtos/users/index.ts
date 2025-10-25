import { z } from "zod";

export const GetUserDto = z.object({
	address: z.string(),
});

export type GetUserDto = z.infer<typeof GetUserDto>;

export const CreateUserDto = z.object({
	address: z.string(),
	promoCode: z.string().optional(),
	dateOfBirth: z.string().optional(),
	session: z
		.object({
			jwt: z.string(),
			expirationTime: z.coerce.number().describe("In seconds"),
		})
		.optional(),
	chainId: z.coerce.number().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const GetUserKycVerificationDto = z.object({
	address: z.string(),
});

export type GetUserKycVerificationDto = z.infer<
	typeof GetUserKycVerificationDto
>;

export const GetUsersDto = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().optional(),
	kycStatus: z
		.enum(["NOT_STARTED", "SUBMITTED", "VERIFIED", "REJECTED"])
		.optional(),
});

export type GetUsersDto = z.infer<typeof GetUsersDto>;

export const UpdateUserKycStatusDto = z.object({
	userId: z.string(),
	status: z.enum(["VERIFIED", "REJECTED"]),
	rejectionReason: z.string().optional(),
});

export type UpdateUserKycStatusDto = z.infer<typeof UpdateUserKycStatusDto>;
