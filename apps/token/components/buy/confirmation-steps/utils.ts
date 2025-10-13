import { z } from "zod";

/**
 * Type guard for FileWithPreview
 */
export function isFileWithPreview(obj: unknown): obj is { file: File } {
	return (
		!!obj &&
		typeof obj === "object" &&
		"file" in obj &&
		obj.file instanceof File
	);
}

/**
 * Label mapping for form fields
 */
export const labelMapping = {
	"recipient.firstName": "Your First Name",
	"recipient.lastName": "Your Last Name",
	"recipient.address": "Your Address",
	"recipient.street": "Your Street",
	"recipient.city": "Your City",
	"recipient.zipcode": "Your Zipcode",
	"recipient.country": "Your Country",
	"recipient.taxId": "Your Tax ID",
	"recipient.state": "Your State",
	"recipient.email": "Recipient Email",
	"recipient.phone": "Recipient Phone",
} as const;

/**
 * Get human-readable label for a variable
 */
export function getLabel(v: string): string {
	const label = labelMapping[v as keyof typeof labelMapping];
	if (!label) {
		if (v.includes(".")) {
			return v
				.split(".")
				.map((l) => l.charAt(0).toUpperCase() + l.slice(1))
				.join(" ");
		}
		return v.charAt(0).toUpperCase() + v.slice(1);
	}
	return label;
}

/**
 * Convert flat variables array to nested objects for form
 */
export function getVariablesAsNestedObjects(variables: string[]) {
	return variables.reduce(
		(acc, v) => {
			const keys = v.split(".");
			let curr = acc;
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (i === keys.length - 1) {
					// @ts-expect-error wontfix
					curr[key] = "";
				} else {
					// @ts-expect-error wontfix
					if (!curr[key] || typeof curr[key] !== "object") {
						// @ts-expect-error wontfix
						curr[key] = {};
					}
					// @ts-expect-error wontfix
					curr = curr[key] as Record<string, string>;
				}
			}
			return acc;
		},
		{} as Record<string, string | Record<string, string>>,
	);
}

/**
 * Form validation schema for SAFT step
 */
export const saftFormSchema = z.object({
	transactionId: z.string().min(1),
	contractId: z.string().min(1),
	variables: z
		.record(z.string(), z.string().or(z.record(z.string(), z.string())))
		.optional(),
});

export type SaftFormData = z.infer<typeof saftFormSchema>;
