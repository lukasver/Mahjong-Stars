import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/common/config/env";
import { prisma } from "@/lib/db/prisma";
import { DocumensoWebhookEventSchema } from "./types";

const API_KEY = env.DOCUMENSO_WEBHOOK_API_KEY;

const bodySchema = DocumensoWebhookEventSchema;

export async function POST(req: NextRequest) {
	// https://docs.documenso.com/developers/webhooks
	const apiKey = req.headers.get("X-Documenso-Secret");
	if (apiKey !== API_KEY) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: z.infer<typeof bodySchema>;
	try {
		body = bodySchema.parse(await req.json());
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON or Payload" },
			{ status: 400 },
		);
	}

	try {
		const isCompleted = body.payload.id && body.payload.status === "COMPLETED";
		const isFailed = body.payload.id && body.event === "DOCUMENT_REJECTED";

		console.debug("DEBUG", JSON.stringify(body));

		const found = await prisma.documentRecipient.findFirst({
			where: { 'OR': [{ externalId: body.payload.id }, { id: body.payload.externalId }] },
			select: {
				id: true,
			},
		});

		if (!found) {
			console.error("Document recipient not found", body.payload);
			return NextResponse.json(
				{ error: "Document recipient not found" },
				{ status: 404 },
			);
		}
		await prisma.documentRecipient.update({
			where: { id: found.id },
			data: {
				...((isCompleted || isFailed) && {
					status: isCompleted ? "SIGNED" : "REJECTED",
				}),
			},
		});
		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json(
			{ error: "Webhook internal error", details: String(err) },
			{ status: 500 },
		);
	}
}
