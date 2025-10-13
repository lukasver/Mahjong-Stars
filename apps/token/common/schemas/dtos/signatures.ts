import { z } from "zod";

export const SignatureSchema = z.object({
	signature: z.string(),
	chainId: z.number(),
	message: z.string(),
});

export type Signature = z.infer<typeof SignatureSchema>;
