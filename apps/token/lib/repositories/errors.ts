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

export const isPrismaError = (
	e: unknown,
): e is Prisma.PrismaClientKnownRequestError => {
	return !!e && e instanceof Prisma.PrismaClientKnownRequestError;
};
