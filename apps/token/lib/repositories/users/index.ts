import { invariant } from "@epic-web/invariant";
import { DateTime } from "luxon";
import { headers } from "next/headers";
import { JWT_EXPIRATION_TIME, ONE_DAY, ROLES } from "@/common/config/constants";
import { env, publicUrl } from "@/common/config/env";
import { ActionCtx } from "@/common/schemas/dtos/sales";
import { CreateUserDto, GetUserDto } from "@/common/schemas/dtos/users";
import { Failure, isObject, Success } from "@/common/schemas/dtos/utils";
import { KycStatusSchema, Profile, User } from "@/common/schemas/generated";
import { prisma } from "@/db";

import {
	extractEmailVerification,
	getUserFromAddress,
} from "@/lib/auth/thirdweb";
import createEmailService from "@/lib/email";
import { getIpAddress, getUserAgent } from "@/lib/geo";
import { hashJwt } from "@/lib/utils/jwt-hash";
import logger from "@/services/logger.server";
import { EmailVerificationService } from "../emails";

class UsersController {
	private readonly emailVerification: EmailVerificationService;

	constructor(emailVerificationService: EmailVerificationService) {
		this.emailVerification = emailVerificationService;
	}

	async getMe({ address }: GetUserDto) {
		try {
			const user = await prisma.user.findUnique({
				where: {
					walletAddress: address,
				},
				select: {
					id: true,
					email: true,
					name: true,
					externalId: true,
					walletAddress: true,
					emailVerified: true,
					isSiwe: true,
					image: true,
					profile: {
						select: {
							firstName: true,
							lastName: true,
							dateOfBirth: true,
							address: true,
						},
					},
					userRole: {
						select: {
							role: true,
						},
					},
					kycVerification: {
						select: {
							id: true,
							status: true,
						},
					},
					// sessions: {
					//   select: {},
					// },
				},
			});
			invariant(user, "User not found");
			const { userRole, ...rest } = user;
			const roles = userRole.reduce(
				(acc, role) => {
					acc[role.role.name as keyof typeof ROLES] = role.role.id;
					return acc;
				},
				{} as Record<keyof typeof ROLES, string>,
			);
			return Success({ ...rest, roles });
		} catch (error) {
			logger(error);
			return Failure(error);
		}
	}

	async createSession(
		address: string,
		{ jwt, expirationTime }: { jwt: string; expirationTime: number },
	) {
		const h = await headers();

		const expiresAt = DateTime.now()
			.plus({
				seconds: expirationTime || JWT_EXPIRATION_TIME,
			})
			.toJSDate();

		const session = await prisma.session.create({
			data: {
				token: hashJwt(jwt),
				expiresAt,
				ipAddress: getIpAddress(new Headers(h)),
				userAgent: getUserAgent(new Headers(h)),
				user: {
					connect: {
						walletAddress: address,
					},
				},
			},
		});
		return session;
	}

	async createUser(payload: CreateUserDto) {
		try {
			invariant(payload, "User data missing");
			//todo: promoCode implementation
			const {
				address,
				promoCode,
				session: { jwt, expirationTime } = {},
				..._data
			} = payload;

			if (promoCode) {
				// checkAndAssignRole({ code: promoCode, user: payload });
			}

			const h = new Headers(await headers());

			const ipAddress = getIpAddress(h);
			const userAgent = getUserAgent(h);

			const expiresAt = DateTime.now()
				.plus({
					seconds: expirationTime || JWT_EXPIRATION_TIME,
				})
				.toJSDate();

			const hashedJwt = jwt ? hashJwt(jwt) : undefined;

			let email = `temp_${address}@${new URL(publicUrl).hostname}`;
			let emailVerified = false;
			let firstName = "Anonymous";
			let lastName = "";
			let image: string | undefined;
			// Check if user has more data in social provider to augment user profile
			const twUser = await getUserFromAddress(address);

			if (twUser) {
				const verif = extractEmailVerification(twUser.profiles);
				if (verif) {
					email = verif.email || email;
					emailVerified = verif.emailVerified;
					firstName = verif.firstName || firstName;
					lastName = verif.lastName || "";
					image = verif.image || undefined;
				}
			}

			const user = await prisma.user.upsert({
				where: {
					walletAddress: address,
				},
				update: {
					...(hashedJwt && {
						sessions: {
							connectOrCreate: {
								where: {
									token: hashedJwt,
								},
								create: {
									token: hashedJwt,
									expiresAt,
									ipAddress,
									userAgent,
								},
							},
						},
					}),
				},
				create: {
					externalId: address,
					walletAddress: address,
					email,
					emailVerified,
					name: lastName ? `${firstName} ${lastName}` : firstName,
					isSiwe: true,
					image,
					profile: {
						create: {},
					},
					...(hashedJwt && {
						sessions: {
							create: {
								token: hashedJwt,
								expiresAt: new Date(expirationTime || Date.now() + ONE_DAY),
								ipAddress,
								userAgent,
							},
						},
					}),
					kycVerification: {
						create: {
							status: KycStatusSchema.enum.NOT_STARTED,
						},
					},
					// ...(chainId
					//   ? {
					//       WalletAddress: {
					//         connectOrCreate: {
					//           where: {
					//             walletAddress_chainId: {
					//               chainId: chainId,
					//               walletAddress: address,
					//             },
					//           },
					//           create: {
					//             chainId: chainId,
					//           },
					//         },
					//       },
					//     }
					//   : {}),
					//TODO!
					// userRole: {
					//   connect: {

					//   }
					// }
				},
			});

			invariant(user, "User could not be created");

			return Success({
				user,
			});
		} catch (error) {
			logger(error);
			return Failure(error);
		}
	}

	/**
	 * Update user and profile information.
	 * @param dto - The update data for user and/or profile.
	 * @param ctx - The action context.
	 * @returns Success with updated user/profile, or Failure on error.
	 */
	async updateUser(
		dto: {
			user: Partial<Omit<User, "id" | "walletAddress">>;
			profile?: Partial<Omit<Profile, "userId">>;
		},
		ctx: ActionCtx,
	) {
		try {
			invariant(dto.user, "User data missing");

			const _user = await prisma.user.findUniqueOrThrow({
				where: {
					walletAddress: ctx.address,
				},
				select: {
					id: true,
					email: true,
				},
			});

			const changedEmail = !!dto.user.email && dto.user.email !== _user.email;
			const updatedFirstname = dto?.profile?.firstName;
			const updatedLastName = dto?.profile?.lastName;

			// update the fullname in the user record if amended
			let fullName: string | undefined;
			if (updatedFirstname) {
				fullName = updatedFirstname;
			}
			if (updatedLastName) {
				fullName = fullName
					? `${fullName} ${updatedLastName}`
					: updatedLastName;
			}

			const promises = [];
			if (dto.profile) {
				promises.push(
					prisma.profile.upsert({
						where: {
							userId: _user.id,
						},
						create: {
							userId: _user.id,
							...dto.profile,
						},
						update: { ...dto.profile },
					}),
				);
			}
			promises.push(
				prisma.user.update({
					where: { id: _user.id },
					data: {
						...dto.user,
						...(fullName && { name: fullName }),
						...(changedEmail
							? { email: dto.user.email, emailVerified: false }
							: {}),
					},
				}),
			);
			if (dto.user.email) {
				promises.push(
					this.emailVerification.createEmailVerification(dto.user.email, ctx),
				);
			}
			const results = await Promise.allSettled(promises);
			results.forEach((result) => {
				if (result.status === "rejected") {
					logger(result.reason);
				}
				if (result.status === "fulfilled" && FailureTG(result.value)) {
					logger(result.value.message);
				}
			});
			const [profile, user] = results
				.filter((p) => p.status === "fulfilled")
				.map((p) => p.value);

			return Success({ user, ...(profile && { profile }) });
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	async verifyEmail(token: string, ctx: ActionCtx) {
		return this.emailVerification.verify(token, ctx);
	}

	async subscribeToNewsletter(ctx: ActionCtx) {
		const user = await prisma.user.findUniqueOrThrow({
			where: {
				walletAddress: ctx.address,
			},
			select: {
				email: true,
			},
		});
		if (user.email) {
			if (process.env.NODE_ENV === "production") {
				await fetch(
					`https://api.emailoctopus.com/lists/${env.EMAIL_OCTOPUS_LIST_ID}/contacts`,
					{
						body: JSON.stringify({
							email_address: user.email,
							tags: {
								"token-dashboard": true,
							},
							status: "subscribed",
						}),
						method: "PUT",
						headers: {
							Authorization: `Bearer ${env.EMAIL_OCTOPUS_API_KEY}`,
							"Content-Type": "application/json",
						},
					},
				).catch((e) => {
					logger(e);
					return null;
				});
			}
		}
		return;
	}

	public crons = {
		async cleanUp(type: "all" | "expired") {
			console.debug(
				`Running sessions cleanup cronjob: ${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}`,
			);
			console.time("sessions-cleanup");
			// Delete all sessions that are expired.
			return await prisma.session
				.deleteMany({
					where:
						type === "expired"
							? {
									expiresAt: {
										lte: DateTime.now().toJSDate(),
									},
								}
							: {},
				})
				.then((res) => {
					console.timeEnd("sessions-cleanup");
					return res;
				});
		},
	};
}

export default new UsersController(
	new EmailVerificationService(createEmailService()),
);

const FailureTG = (obj: unknown): obj is Failure<unknown> => {
	return isObject(obj) && "success" in obj && !obj.success;
};
