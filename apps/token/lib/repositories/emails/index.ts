import "server-only";
import { invariant } from "@epic-web/invariant";
import { env, publicUrl } from "@/common/config/env";
import { ActionCtx } from "@/common/schemas/dtos/sales";
import { Failure, Success } from "@/common/schemas/dtos/utils";
import { prisma } from "@/db";
import { IEmailService } from "@/lib/email";
import logger from "@/lib/services/logger.server";

export class EmailVerificationService {
	private readonly sender: IEmailService;
	constructor(emailService: IEmailService) {
		this.sender = emailService;
	}

	async verify(token: string, ctx: ActionCtx) {
		invariant(ctx.address, "UNAUTHORIZED");
		invariant(token, "Token is required");

		try {
			const user = await prisma.user.findUniqueOrThrow({
				where: {
					walletAddress: ctx.address,
					EmailVerification: {
						token,
					},
				},
				select: {
					id: true,
					EmailVerification: {
						select: {
							expiredAt: true,
						},
					},
				},
			});

			const exp = user?.EmailVerification?.expiredAt;
			invariant(exp, "Token not found");

			if (exp < new Date()) {
				await this.daleteToken(token, ctx);
				return Failure(
					"Token expired. Please re-enter your email to generate a new token.",
					400,
				);
			}

			await prisma.$transaction(async (tx) => {
				return Promise.all([
					tx.user.update({
						where: { id: user.id },
						data: {
							emailVerified: true,
						},
					}),
					this.daleteToken(token, ctx).catch((e) => {
						logger(e);
					}),
				]);
			});

			return Success({
				message: "Email verified successfully",
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	private generateToken() {
		return Math.floor(Math.random() * 900000 + 100000).toString();
	}

	async createEmailVerification(email: string, ctx: ActionCtx) {
		try {
			invariant(email, "Email is required");
			let userId = ctx.userId;
			if (!userId && ctx.address) {
				userId = (
					await prisma.user.findUnique({
						where: {
							walletAddress: ctx.address,
						},
						select: {
							id: true,
						},
					})
				)?.id;
			}

			const verification = await prisma.emailVerification.upsert({
				where: {
					userId,
				},
				update: {
					email,
					token: this.generateToken(),
				},
				create: {
					email,
					token: this.generateToken(),
					user: { connect: { id: userId } },
				},
			});

			const sendResponse = await this.sender.sendReactEmail(
				"emailVerification",
				{
					url: `${publicUrl}/verify-email?token=${verification.token}`,
					logoUrl: `https://storage.googleapis.com/mjs-public/branding/icon-120x120.png`,
					token: verification.token,
				},
				{ to: { email }, subject: "Email Verification" },
			);

			invariant(sendResponse, "Error sending email");

			return Success(
				Object.assign(
					{ message: "Verification email sent successfully" },
					env.IS_DEV ? { code: verification.token } : {},
				),
			);
		} catch (error) {
			logger(error);
			return Failure(error);
		}
	}

	async daleteToken(token: string, ctx: ActionCtx) {
		try {
			invariant(token, "Token is required");
			await prisma.emailVerification.deleteMany({
				where: { token, userId: ctx.userId },
			});
			return Success({ message: "Deleted Register" }, { status: 200 });
		} catch (error) {
			logger(error);
			return Failure(error);
		}
	}
}
