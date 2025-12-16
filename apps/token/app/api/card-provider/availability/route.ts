import { NextResponse } from "next/server";
import { env } from "@/common/config/env";

const ENABLED = false;

/**
 * GET endpoint to check if card payment provider is available
 * Checks if all required environment variables for the card payment provider are configured
 * Uses generic naming to avoid leaking provider-specific information to the client
 */
export async function GET() {
  try {
    // Check if all required Instaxchange environment variables are present
    const requiredEnvVars = [
      ENABLED,
      env.INSTAXCHANGE_API_KEY,
      env.INSTAXCHANGE_API_URL,
      env.INSTAXCHANGE_WEBHOOK_SECRET,
      env.INSTAXCHANGE_ACCOUNT_REF_ID,
    ];

    const available = requiredEnvVars.every(
      (value) => value !== undefined && value !== null && value !== "" && value !== false,
    );

    return NextResponse.json({ available });
  } catch (_e) {
    // If there's an error accessing env vars, provider is not available
    return NextResponse.json({ available: false });
  }
}
