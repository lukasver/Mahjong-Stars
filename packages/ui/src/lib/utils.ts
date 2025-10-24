import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Converts a base64 string to a File object
 * @param base64String - The base64 encoded string (with or without data URL prefix)
 * @param filename - The name for the file
 * @param mimeType - The MIME type of the file
 * @returns A File object that can be sent over the network
 */
export function base64ToFile(
	base64String: string,
	filename: string,
	mimeType: string,
): File {
	// Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
	const base64Data = base64String.includes(",")
		? base64String.split(",")[1]
		: base64String;

	if (!base64Data) {
		throw new Error("Invalid base64 string");
	}
	// Convert base64 to binary
	const byteCharacters = atob(base64Data);
	const byteNumbers = new Array(byteCharacters.length);

	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}

	const byteArray = new Uint8Array(byteNumbers);
	const blob = new Blob([byteArray], { type: mimeType });

	return new File([blob], filename, { type: mimeType });
}
