// https://docs.documenso.com/developers/webhooks#example-payloads

import z from "zod";

// Common payload structure
interface DocumensoDocumentMeta {
	id: string;
	subject?: string | null;
	message?: string | null;
	timezone: string;
	password?: string | null;
	dateFormat: string;
	redirectUrl?: string | null;
	signingOrder: string;
	typedSignatureEnabled: boolean;
	language: string;
	distributionMethod: string;
	emailSettings?: any | null;
}

interface DocumensoRecipient {
	id: number;
	documentId?: number | null;
	templateId?: number | null;
	email: string;
	name: string;
	token: string;
	documentDeletedAt?: string | null;
	expired?: string | null;
	signedAt?: string | null;
	authOptions?: any | null;
	signingOrder?: number | null;
	rejectionReason?: string | null;
	role: string;
	readStatus: string;
	signingStatus: string;
	sendStatus: string;
}

interface DocumensoWebhookPayload {
	id: number;
	externalId?: string | null;
	userId: number;
	authOptions?: any | null;
	formValues?: any | null;
	visibility: string;
	title: string;
	status: string;
	documentDataId: string;
	createdAt: string;
	updatedAt: string;
	completedAt?: string | null;
	deletedAt?: string | null;
	teamId?: number | null;
	templateId?: number | null;
	source: string;
	documentMeta: DocumensoDocumentMeta;
	Recipient: DocumensoRecipient[];
}

export interface DocumensoWebhookEvent {
	event: string;
	payload: DocumensoWebhookPayload;
	createdAt: string;
	webhookEndpoint: string;
}

// Specific event types
interface DocumentCreatedEvent extends DocumensoWebhookEvent {
	event: "DOCUMENT_CREATED";
}

interface DocumentSentEvent extends DocumensoWebhookEvent {
	event: "DOCUMENT_SENT";
}

interface DocumentOpenedEvent extends DocumensoWebhookEvent {
	event: "DOCUMENT_OPENED";
}

interface DocumentSignedEvent extends DocumensoWebhookEvent {
	event: "DOCUMENT_SIGNED";
}

interface DocumentCompletedEvent extends DocumensoWebhookEvent {
	event: "DOCUMENT_COMPLETED";
}

interface DocumentRejectedEvent extends DocumensoWebhookEvent {
	event: "DOCUMENT_REJECTED";
}

export const DocumensoWebhookEventSchema = z
	.object({
		event: z.enum(["DOCUMENT_SIGNED", "DOCUMENT_REJECTED"]),
		payload: z.any(),
	})
	.passthrough();

// Union type for all events
export type DocumensoWebhookEvents =
	| DocumentCreatedEvent
	| DocumentSentEvent
	| DocumentOpenedEvent
	| DocumentSignedEvent
	| DocumentCompletedEvent
	| DocumentRejectedEvent;

export type DocumensoEventName = DocumensoWebhookEvents["event"];
