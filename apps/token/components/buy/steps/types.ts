import { z } from "zod";

export const QuestionnaireSchema = z.object({
	// Employment / Income
	occupation: z.string().min(1, "Occupation is required"),
	company: z.string().min(1, "Company is required"),
	monthlyIncome: z.string().min(1, "Income range is required"),

	// Funds Origin
	fundsSource: z.string().min(1, "Funds source is required"),
	fundsCountry: z.string().min(1, "Funds country is required"),

	// Banking / Transaction Channel
	accountOwnership: z.string().min(1, "Account ownership is required"),
	thirdPartyContribution: z
		.string()
		.min(1, "Third party contribution is required"),

	// Purpose / Intent
	transactionPurpose: z.string().min(1, "Transaction purpose is required"),
	purchasingFor: z.string().min(1, "Purchasing for is required"),
	futureTransactions: z.string().min(1, "Future transactions is required"),

	// Wealth Background (optional)
	// wealthDescription: z.string().default(""),
});

export type QuestionnaireData = z.infer<typeof QuestionnaireSchema>;
