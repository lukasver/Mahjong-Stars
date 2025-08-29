import { z } from "zod";

export const questParser = z.object({
	id: z.string().min(1),
	code: z.string().min(1),
	inputs: z.preprocess(
		(val) => (typeof val === "string" ? val.split(",").filter(Boolean) : []),
		z.array(z.string()),
	),
	limit: z.coerce.number(),
	start: z.coerce.date(),
	expiration: z.coerce.date().optional(),
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
