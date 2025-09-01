import { z } from "zod";

export const questParser = z.object({
	id: z.string().min(1),
	code: z.string().min(1),
	inputs: z.preprocess(
		(val) => (typeof val === "string" ? val.split(",").filter(Boolean) : []),
		z.array(z.string()).min(1),
	),
	limit: z.coerce.number(),
	start: z
		.string()
		.transform((val) => {
			return new Date(val);
		})
		.refine(
			(d) => {
				// @ts-ignore
				if (!(d instanceof Date) || isNaN(d)) {
					return false;
				}
				const now = new Date();
				return now >= d;
			},
			{
				message: "Invalid date format",
			},
		),
	expiration: z
		.string()
		.optional()
		.transform((val) => val && new Date(val))
		.optional(),
	status: z.enum(["DRAFT", "FINALIZED"]).optional(),
	results: z
		.string()
		.url()
		.transform(
			(val) => val.split("https://docs.google.com/spreadsheets/d/")[1],
		),
});

export const questResultValidator = z
	.object({
		code: z.string().min(1, "Code is required"),
		id: z.string().min(1, "Quest ID is required"),
		submissionId: z.string().min(1, "Submission ID is required"),
		results: z.string().min(1, "Results identifier is required"),
	})
	.passthrough();

/**
 * Represents a quest claim configuration from Google Sheets
 */
export type Quest = z.infer<typeof questParser>;

export type QuestResponse = z.infer<typeof questResultValidator> & {
	[key: string]: string;
};
