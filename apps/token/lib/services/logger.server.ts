import { env } from "../../common/config/env";

interface LogContext {
	level: "debug" | "info" | "warn" | "error";
	message: string;
	metadata?: Record<string, unknown>;
	timestamp?: string;
	error?: {
		name?: string;
		message?: string;
		stack?: string;
		code?: string | number;
	};
}

const createLogEntry = (
	level: LogContext["level"],
	message: string,
	metadata?: Record<string, unknown>,
	error?: Error | unknown,
): LogContext => {
	const logEntry: LogContext = {
		level,
		message,
		metadata,
		timestamp: new Date().toISOString(),
	};

	// If an error is provided, extract structured error information
	if (error) {
		if (error instanceof Error) {
			logEntry.error = {
				name: error.name,
				message: error.message,
				stack: error.stack,
				code: (error as any).code,
			};
		} else {
			// Handle non-Error objects (like API responses, custom error objects, etc.)
			logEntry.error = {
				message: String(error),
				name: error?.constructor?.name || "Unknown",
			};
		}
	}

	return logEntry;
};

const log = (
	level: LogContext["level"],
	message: string,
	metadata?: Record<string, unknown>,
	error?: Error | unknown,
) => {
	if (env.IS_DEV || env.DEBUG) {
		const logEntry = createLogEntry(level, message, metadata, error);
		console[level](JSON.stringify(logEntry, null, 2));
	} else {
		// In production, this will be captured by Vercel's log drain
		const logEntry = createLogEntry(level, message, metadata, error);
		console[level](JSON.stringify(logEntry));
	}
};

// Main logger function that can handle both simple error logging and structured logging
const logger = (
	error: Error | unknown,
	message?: string,
	metadata?: Record<string, unknown>,
) => {
	if (error instanceof Error) {
		log("error", message || error.message, metadata, error);
	} else if (typeof error === "string") {
		log("info", error, metadata);
	} else {
		log("error", message || "Unknown error occurred", metadata, error);
	}
};

// Structured logging methods
logger.debug = (
	message: string,
	metadata?: Record<string, unknown>,
	error?: Error | unknown,
) => log("debug", message, metadata, error);

logger.info = (
	message: string,
	metadata?: Record<string, unknown>,
	error?: Error | unknown,
) => log("info", message, metadata, error);

logger.warn = (
	message: string,
	metadata?: Record<string, unknown>,
	error?: Error | unknown,
) => log("warn", message, metadata, error);

logger.error = (
	message: string,
	metadata?: Record<string, unknown>,
	error?: Error | unknown,
) => log("error", message, metadata, error);

export default logger;
