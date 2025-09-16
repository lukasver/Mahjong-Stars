import { PrismaClient } from "@prisma/client";
import { ROLES } from "@/common/config/constants";
import { User } from "@/common/schemas/generated";

export async function seedRoles(prisma: PrismaClient) {
	const _ROLES = [
		{
			name: ROLES.SUPER_ADMIN,
			description: "Admin role",
		},
		{
			name: ROLES.ADMIN,
			description: "Admin role",
		},
		{
			name: ROLES.KYC_VERIFIER,
			description: "KYC verifier role",
		},
		{
			name: ROLES.KYC_ADMIN,
			description: "KYC admin role",
		},
		{
			name: ROLES.AMBASSADOR,
			description: "Ambassador role",
		},
	] as const;

	return prisma.role.createManyAndReturn({
		data: _ROLES.map(({ name, description }) => ({
			name,
			description,
		})),
		skipDuplicates: true,
	});
}
export async function seedUserRoles(
	eligibleUsers: (Pick<User, "id"> & { role: keyof typeof ROLES })[],
	prisma: PrismaClient,
) {
	return Promise.all(
		eligibleUsers.map((user) =>
			prisma.userRole.create({
				data: {
					user: {
						connect: {
							id: user.id,
						},
					},
					role: {
						connect: {
							name: user.role,
						},
					},
				},
			}),
		),
	);
}
