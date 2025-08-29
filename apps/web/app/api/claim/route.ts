import { invariant } from "@epic-web/invariant";
import { verifySolution } from "altcha-lib";
import { NextResponse } from "next/server";
import { z } from "zod";
import { QuestResponse, questResultValidator } from "@/components/claim/types";
import { SHEETS_ERROR_CODES } from "@/lib/constants";
import sheets, { SheetsError } from "@/lib/sheets";

const hmacKey = process.env.ALTCHA_HMAC_KEY!;
if (!hmacKey) {
	throw new Error("ALTCHA_HMAC_KEY is not set");
}

const handler = async (req: Request) => {
	try {
		if (req.method === "POST") {
			const body = await req.json();
			const result = questResultValidator
				.merge(z.object({ captcha: z.string().min(1, "Captcha is required") }))
				.passthrough()
				.safeParse(body);

			if (!result.success) {
				return NextResponse.json(
					{ error: "Invalid request", success: false },
					{ status: 400 },
				);
			}

			const { captcha, ...formData } = result.data;

			console.debug("🚀 ~ route.ts:30 ~ result.data:", result.data);

			const verified = await verifySolution(captcha, hmacKey);
			if (!verified) {
				return NextResponse.json({
					success: false,
					error: "Captacha verification failed",
				});
			}

			//TODO! send results
			const quest = await sheets.getById(result.data.results);
			invariant(quest, "Quest not found");

			// I should check if there are more values in the form than what is allowed.

			console.debug("🚀 ~ route.ts:41 ~ quest:", quest);
			const res = await sheets.submitClaim(
				result.data.id,
				formData as QuestResponse,
			);

			console.debug("🚀 ~ route.ts:48 ~ res:", res);

			return NextResponse.json({
				success: true,
				message: "Claimed",
			});
		}

		return NextResponse.redirect(new URL("/", req.url));
	} catch (error) {
		console.error(error);

		// Handle custom SheetsError with proper status codes and error codes
		if (error instanceof SheetsError) {
			const { code, message, statusCode } = error;

			// Handle specific error codes
			switch (code) {
				case SHEETS_ERROR_CODES.QUEST_EXPIRED:
				case SHEETS_ERROR_CODES.QUEST_FINALIZED:
				case SHEETS_ERROR_CODES.QUEST_LIMIT_REACHED:
					return NextResponse.json(
						{
							error: SHEETS_ERROR_CODES.QUEST_FINALIZED,
							success: false,
						},
						{ status: 400 },
					);

				case SHEETS_ERROR_CODES.QUEST_NOT_FOUND:
				case SHEETS_ERROR_CODES.SHEET_NOT_FOUND:
					return NextResponse.json(
						{
							error: "Invalid quest",
							success: false,
						},
						{ status: statusCode },
					);

				case SHEETS_ERROR_CODES.ENV_MISSING:
					// Should send email to admin for configuration issues
					console.error(
						"SHOULD AUTH SERVICE ACCOUNT WITH GOOGLE RESULTS SHEET",
					);
					return NextResponse.json(
						{
							error: "Configuration error",
							code,
							success: false,
						},
						{ status: 500 },
					);

				default:
					return NextResponse.json(
						{
							error: message,
							code,
							success: false,
						},
						{ status: statusCode },
					);
			}
		}

		// Handle other errors
		return NextResponse.json(
			{ error: "Internal server error", success: false },
			{ status: 500 },
		);
	}
};

export { handler as GET, handler as POST };
