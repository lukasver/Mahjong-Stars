import "server-only";
import { createHash } from "node:crypto";
import { invariant } from "@epic-web/invariant";
import { env } from "@/common/config/env";
import logger from "../logger.server";
import { CreateSessionRequest, CreateSessionResponse, InstaxchangeApiError, SessionStatusResponse } from './types';


/**
 * Configuration options for Instaxchange service
 */
interface InstaxchangeServiceConfig {
  apiKey: string;
  apiUrl: string;
  webhookSecret: string;
  accountRefId?: string;
  maxRetries?: number;
  retryDelay?: number;
}



/**
 * Service class for interacting with Instaxchange payment API
 * Handles session creation, status checking, and webhook verification
 */
export class InstaxchangeService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly webhookSecret: string;
  private readonly accountRefId: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly toCurrency = "USDC_POLYGON";

  constructor(config?: Partial<InstaxchangeServiceConfig>) {
    const {
      apiKey = env.INSTAXCHANGE_API_KEY,
      apiUrl = env.INSTAXCHANGE_API_URL,
      webhookSecret = env.INSTAXCHANGE_WEBHOOK_SECRET,
      accountRefId = env.INSTAXCHANGE_ACCOUNT_REF_ID,
      maxRetries = process.env.NODE_ENV === "production" ? 3 : 1,
      retryDelay = 1000,
    } = config || {};

    invariant(apiKey, "INSTAXCHANGE_API_KEY is required");
    invariant(apiUrl, "INSTAXCHANGE_API_URL is required");
    invariant(webhookSecret, "INSTAXCHANGE_WEBHOOK_SECRET is required");
    invariant(accountRefId, "INSTAXCHANGE_ACCOUNT_REF_ID is required");

    this.apiKey = apiKey;
    this.apiUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.webhookSecret = webhookSecret;
    this.accountRefId = accountRefId;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Creates a payment session with Instaxchange
   * @param fromAmount - Amount the user is sending (required when amountDirection is "sending")
   * @param fromCurrency - Currency the user is sending (e.g., "USD")
   * @param transactionId - Internal transaction ID used for webhook correlation
   * @param address - Destination wallet address that will receive the crypto
   * @param options - Optional overrides for return URL, payment method and receiver details
   * @returns Promise with session details including sessionId and sessionUrl
   * @throws Error if session creation fails
   */
  async createSession(args: Omit<CreateSessionRequest, "toCurrency" | "accountRefId" | "webhookRef"> & { transactionId: string, toCurrency?: CreateSessionRequest["toCurrency"] }): Promise<CreateSessionResponse & { iframeUrl: string }> {

    const {
      fromAmount,
      toAmount,
      toCurrency = this.toCurrency,
      fromCurrency,
      address,
      amountDirection,
      transactionId,
      ...opts
    } = args;

    invariant(fromCurrency, "Currency is required");
    invariant(transactionId, "Transaction ID is required");
    invariant(address, "Destination wallet address is required");

    if (amountDirection === "sending") {
      invariant(
        typeof fromAmount === "number" && fromAmount > 0,
        "fromAmount is required when amountDirection is 'sending'",
      );
    } else {
      invariant(
        typeof toAmount === "number" && toAmount > 0,
        "toAmount is required when amountDirection is 'receiving'",
      );
    }

    const payload: CreateSessionRequest = {
      accountRefId: this.accountRefId,
      toCurrency,
      fromCurrency,
      address,
      amountDirection,
      ...(amountDirection === "sending" ? { fromAmount } : { toAmount }),
      // add a nonce to the webhookRef to prevent duplicate webhooks
      webhookRef: `${transactionId}-${Date.now()}`,
      returnUrl: opts?.returnUrl,
      method: opts.method,
      email: opts?.email,
      firstName: opts?.firstName,
      lastName: opts?.lastName,
      country: opts?.country,
    };

    console.log("🚀 ~ index.ts:115 ~ payload:", payload);


    return this.executeWithRetry(async () => {
      const response = await fetch(`${this.apiUrl}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new Error(
          `Failed to create Instaxchange session: ${errorData.message}`,
        );
      }
      const data = (await response.json()) as CreateSessionResponse;
      invariant(data.id, "Session ID is missing from response");
      return Object.assign(data, { iframeUrl: `${this.apiUrl.split('/api')[0]}/order/${data.id}` });
    });
  }

  /**
   * Gets the current status of a payment session
   * @param sessionId - The Instaxchange session ID
   * @returns Promise with session status details
   * @throws Error if status retrieval fails
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
    invariant(sessionId, "Session ID is required");

    return this.executeWithRetry(async () => {
      const response = await fetch(
        `${this.apiUrl}/session/${sessionId}/status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new Error(
          `Failed to get Instaxchange session status: ${errorData.message}`,
        );
      }

      const data = (await response.json()) as SessionStatusResponse;

      invariant(data.sessionId, "Session ID is missing from response");
      invariant(data.sessionStatus, "Status is missing from response");

      return data;
    });
  }

  /**
   * Creates an MD5 hash of a JSON payload with sorted keys, as per Instaxchange specification
   * @param payload - The webhook payload object
   * @param secret - The webhook secret key
   * @returns MD5 hash hex string
   */
  private createWebhookSignature(
    payload: Record<string, unknown>,
    secret: string,
  ): string {
    // Sort JSON keys alphabetically
    const sortedKeys = Object.keys(payload).sort();
    const sorted: Record<string, unknown> = {};
    for (const k of sortedKeys) sorted[k] = (payload as any)[k];
    // JSON encode the sorted payload
    const jsonString = JSON.stringify(sorted);

    // Append secret key with colon separator
    const stringToHash = `${jsonString}:${secret}`;

    // Create MD5 hash
    return createHash("md5").update(stringToHash).digest("hex");
  }

  /**
   * Verifies the authenticity of a webhook payload using MD5 signature with sorted keys
   * According to Instaxchange documentation:
   * 1. Sort JSON keys alphabetically
   * 2. JSON encode the sorted payload
   * 3. Append secret key with colon separator
   * 4. MD5 hash the result
   * 5. Compare with X-InstaXWH-KEY header value
   *
   * @param payload - The raw webhook payload (string or object)
   * @param signature - The signature from the X-InstaXWH-KEY header
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhookSignature(
    payload: string | Record<string, unknown>,
    signature: string,
  ): boolean {
    invariant(payload, "Payload is required");
    invariant(signature, "Signature is required");

    try {
      // Parse payload if it's a string
      let payloadObject: Record<string, unknown>;
      if (typeof payload === "string") {
        payloadObject = JSON.parse(payload) as Record<string, unknown>;
      } else {
        payloadObject = payload;
      }

      // Create expected signature using sorted keys and MD5
      const expectedSignature = this.createWebhookSignature(
        payloadObject,
        this.webhookSecret,
      );

      // Compare signatures using constant-time comparison to prevent timing attacks
      if (expectedSignature.length !== signature.length) {
        logger.warn("Instaxchange webhook signature length mismatch", {
          expectedLength: expectedSignature.length,
          providedLength: signature.length,
        });
        return false;
      }

      let result = 0;
      for (let i = 0; i < expectedSignature.length; i++) {
        result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
      }

      const isValid = result === 0;

      if (!isValid) {
        logger.warn("Instaxchange webhook signature verification failed", {
          expectedSignature: expectedSignature.substring(0, 8) + "...",
          providedSignature: signature.substring(0, 8) + "...",
        });
      }

      return isValid;
    } catch (error) {
      logger.error("Error verifying Instaxchange webhook signature", {}, error);
      return false;
    }
  }

  /**
   * Executes an API call with retry logic
   * @param fn - The function to execute
   * @returns Promise with the result
   * @throws Error if all retries fail
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on client errors (4xx)
      if (
        error instanceof Error &&
        error.message.includes("Failed to") &&
        error.message.includes("4")
      ) {
        throw error;
      }

      if (attempt >= this.maxRetries) {
        logger.error(
          `Instaxchange API call failed after ${this.maxRetries} attempts`,
          { attempt },
          error,
        );
        throw error;
      }

      const delay = this.retryDelay * attempt; // Exponential backoff
      logger.warn(
        `Instaxchange API call failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`,
        { attempt, maxRetries: this.maxRetries },
        error,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.executeWithRetry(fn, attempt + 1);
    }
  }

  /**
   * Parses error response from Instaxchange API
   * @param response - The fetch Response object
   * @returns Parsed error data
   */
  private async parseErrorResponse(
    response: Response,
  ): Promise<InstaxchangeApiError> {
    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as
          | InstaxchangeApiError
          | { error?: string; message?: string };
        return {
          message:
            data.message ||
            ("error" in data && data.error) ||
            `HTTP ${response.status} ${response.statusText}`,
          code: response.status.toString(),
          details: data,
        };
      }
      const text = await response.text();
      return {
        message: text || `HTTP ${response.status} ${response.statusText}`,
        code: response.status.toString(),
      };
    } catch {
      return {
        message: `HTTP ${response.status} ${response.statusText}`,
        code: response.status.toString(),
      };
    }
  }
}

let service: InstaxchangeService | null = null;
try {
  service = new InstaxchangeService();
} catch (e) {
  logger.error(
    `Error creating Instaxchange service: ${e instanceof Error ? e.message : "Unknown error"}`,
  );

}


/**
 * Default singleton instance of InstaxchangeService
 * Uses environment variables for configuration
*/
export const instaxchangeService = service;
