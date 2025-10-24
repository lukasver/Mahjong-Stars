import { NextRequest, NextResponse } from "next/server";
import { getUser } from "thirdweb/wallets";
import { serverClient } from "@/lib/auth/thirdweb";

// Your frontend's address: http://localhost:3000 or https://my.production.domain.com

export async function GET(req: NextRequest) {
	const user = await getUser({
		client: serverClient,
		walletAddress: "0x92D6DDdeC57a8e043d4B47df16ACCBc4bf5420c5",
	});

	return NextResponse.json(user);
}
