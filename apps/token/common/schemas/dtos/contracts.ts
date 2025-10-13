import { z } from "zod";
import {
	ContractStatusSchema,
	DocumentSignatureStatusSchema,
	SignableDocumentRoleSchema,
} from "../generated";

export const CreateContractStatusDto = ContractStatusSchema.pick({
	contractId: true,
	userId: true,
});

export type CreateContractStatusDto = z.infer<typeof CreateContractStatusDto>;

export const UpdateContractStatusDto = ContractStatusSchema.omit({
	createdAt: true,
	updatedAt: true,
})
	.partial()
	.required({ status: true, id: true, userId: true });

export type UpdateContractStatusDto = z.infer<typeof UpdateContractStatusDto>;

export const DocumensoStatusToContractStatusMapping = {
	DRAFT: DocumentSignatureStatusSchema.enum.CREATED,
	PENDING: DocumentSignatureStatusSchema.enum.SENT_FOR_SIGNATURE,
	COMPLETED: DocumentSignatureStatusSchema.enum.SIGNED,
	REJECTED: DocumentSignatureStatusSchema.enum.REJECTED,
} as const;

export const ApproverSchema = z.object({
	email: z.string().email(),
	fullname: z.string(),
	role: SignableDocumentRoleSchema,
});

export type ApproverSchema = z.infer<typeof ApproverSchema>;
