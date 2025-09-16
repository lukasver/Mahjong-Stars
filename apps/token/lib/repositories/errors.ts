import { Prisma } from "@prisma/client";
import HttpStatusCode from "./httpStatusCodes";

export class HttpError extends Error {
	status = HttpStatusCode.INTERNAL_SERVER_ERROR;
	payload;

	constructor(status: HttpStatusCode, message: string, payload?: unknown) {
		super(message);
		this.status = status;
		this.payload = payload;

		Object.setPrototypeOf(this, HttpError.prototype);
	}

	getMessage(): { message: string } {
		return { message: "Something went wrong: " + this.message };
	}
	getStatus(): { status: HttpStatusCode } {
		return { status: this.status };
	}

	getPayload(): { payload?: unknown } {
		return { payload: this.payload };
	}
	getError(): { message: string; status: HttpStatusCode } {
		return { ...this.getMessage(), ...this.getStatus(), ...this.getPayload() };
	}
}

export class DbError extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, HttpError.prototype);
	}
}

/**
 * Custom error class for transaction validation failures
 * Provides detailed context about what validation failed and why
 */
export class TransactionValidationError extends Error {
	readonly validationType:
		| "CREATION"
		| "STATUS_UPDATE"
		| "SALE_CLOSING"
		| "TIMEOUT"
		| "UNKNOWN";
	readonly field?: string;
	readonly value?: unknown;
	readonly context?: Record<string, unknown>;

	constructor(
		validationType:
			| "CREATION"
			| "STATUS_UPDATE"
			| "SALE_CLOSING"
			| "TIMEOUT"
			| "UNKNOWN",
		message: string,
		context?: Record<string, unknown>,
	) {
		super(message);
		this.validationType = validationType;
		this.context = context;

		// Extract field and value from context if available
		if (context) {
			this.field = context.field as string;
			this.value = context.value;
		}

		Object.setPrototypeOf(this, TransactionValidationError.prototype);
	}

	/**
	 * Returns a structured error response for API responses
	 */
	getValidationError(): {
		message: string;
		validationType: string;
		field?: string;
		value?: unknown;
		context?: Record<string, unknown>;
	} {
		return {
			message: this.message,
			validationType: this.validationType,
			field: this.field,
			value: this.value,
			context: this.context,
		};
	}
}

export const isPrismaError = (
	e: unknown,
): e is Prisma.PrismaClientKnownRequestError => {
	return !!e && e instanceof Prisma.PrismaClientKnownRequestError;
};
