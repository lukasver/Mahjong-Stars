import { NextRequest, NextResponse } from "next/server";
import { getUser } from "thirdweb";
import { serverClient } from "@/lib/auth/thirdweb";

export async function GET(req: NextRequest) {
	const isProduction = process.env.NODE_ENV === "production";
	if (isProduction) {
		const authHeader = req.headers.get("authorization");
		const expectedSecret = process.env.JWT_SECRET;
		if (
			!authHeader ||
			!authHeader.startsWith("Bearer ") ||
			!expectedSecret ||
			authHeader.slice(7) !== expectedSecret
		) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
	}
	const user = await getUser({
		client: serverClient,
		walletAddress: req.nextUrl.searchParams.get("address") || "",
	});
	return NextResponse.json({ user });
}
