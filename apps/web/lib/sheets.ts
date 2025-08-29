import "server-only";
import { invariant } from "@epic-web/invariant";
import {
	auth,
	sheets as GoogleSheets,
	type sheets_v4,
} from "@googleapis/sheets";
import { QuestResponse, questParser } from "@/components/claim/types";
import { SHEETS_ERROR_CODES } from "./constants";

/**
 * Custom error class for Sheets operations with unique error codes
 */
export class SheetsError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode: number = 500,
	) {
		super(message);
		this.name = "SheetsError";
	}
}

export class Sheets {
	private client: ReturnType<typeof this.getSheetsClient>;

	constructor() {
		this.client = this.getSheetsClient();
	}

	private getCredentials = () => {
		const key = process.env.GCP_SERVICE_ACCOUNT;
		if (!key) {
			throw new SheetsError(
				"GCP_SERVICE_ACCOUNT is not set",
				SHEETS_ERROR_CODES.ENV_MISSING,
				500,
			);
		}
		return JSON.parse(Buffer.from(key, "base64").toString("utf-8")) as Record<
			string,
			unknown
		>;
	};

	private getSheetsClient = () => {
		const client = new auth.GoogleAuth({
			credentials: this.getCredentials(),
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});
		invariant(client, "Failed to create client");
		const sheets = GoogleSheets({
			version: "v4",
			auth: client,
		});
		invariant(sheets, "Failed to create sheets instance");
		return sheets;
	};

	async getById(id: string): Promise<sheets_v4.Schema$Spreadsheet> {
		const res = await this.client.spreadsheets.get({
			spreadsheetId: id,
		});
		return res?.data;
	}

	async getValues(sheetId: string) {
		const { data } = await this.client.spreadsheets.values.get({
			range: `quests!A:G`,
			majorDimension: `ROWS`,
			spreadsheetId: sheetId,
		});

		if (!data?.values) {
			throw new SheetsError(
				"Failed to get sheet values",
				SHEETS_ERROR_CODES.VALUES_NOT_FOUND,
				404,
			);
		}

		const headers = data.values[0];
		if (!headers) {
			throw new SheetsError(
				"Failed to get headers",
				SHEETS_ERROR_CODES.HEADERS_NOT_FOUND,
				404,
			);
		}

		return { headers, data: data.values.slice(1) } as {
			headers: string[];
			data: string[][];
		};
	}

	async getQuestData(questId: string) {
		const { data, headers } = await this.getValues(
			process.env.GOOGLE_SHEET_ID!,
		);

		if (!data) {
			throw new SheetsError(
				"Sheet not found",
				SHEETS_ERROR_CODES.SHEET_NOT_FOUND,
				404,
			);
		}

		const quest = data.find((row) => row[0] === questId);
		if (!quest) {
			throw new SheetsError(
				"Quest not found",
				SHEETS_ERROR_CODES.QUEST_NOT_FOUND,
				404,
			);
		}

		const parsed = questParser.parse(
			headers?.reduce(
				(acc, header, index) => {
					acc[header] = quest[index] ?? "";
					return acc;
				},
				{} as Record<string, string>,
			),
		);
		return parsed;
	}

	async validateClaim(questId: string, targetSheetId: string, _code: string) {
		// Should check if the sheet has a limit, and if the user is inside the limit
		const parsed = await this.getQuestData(questId);
		const existingCount = await this.countBySingleColumn(targetSheetId);

		const { expiration, limit, status, code } = parsed;

		console.debug("LALALa", code, _code);

		if (code?.trim() !== _code?.trim()) {
			throw new SheetsError(
				"Invalid code",
				SHEETS_ERROR_CODES.CODE_INVALID,
				400,
			);
		}

		if (expiration) {
			const now = new Date();
			const expirationDate = new Date(expiration);
			if (expirationDate < now) {
				throw new SheetsError(
					"Quest has expired",
					SHEETS_ERROR_CODES.QUEST_EXPIRED,
					400,
				);
			}
		}
		if (status === "FINALIZED") {
			throw new SheetsError(
				"Quest is finalized",
				SHEETS_ERROR_CODES.QUEST_FINALIZED,
				400,
			);
		}
		if (limit && existingCount >= limit) {
			throw new SheetsError(
				"Quest has reached the limit",
				SHEETS_ERROR_CODES.QUEST_LIMIT_REACHED,
				400,
			);
		}
	}

	private async countBySingleColumn(
		sheetId: string = process.env.GOOGLE_SHEET_ID!,
		sheetName?: string,
	) {
		const { data } = await this.client.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: `${sheetName ?? "Sheet1"}!A:A`,
			valueRenderOption: "UNFORMATTED_VALUE",
		});
		return data.values?.length ?? 0;
	}

	async submitClaim(questId: string, data: QuestResponse) {
		await this.validateClaim(questId, data.results, data.code);
		return this.append(data.results, data);
	}

	private async append(sheetId: string, data: QuestResponse) {
		const res = await this.client.spreadsheets.values.append({
			spreadsheetId: sheetId,
			// Todo we should check the length based on data?
			range: "Sheet1!A:G",
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: [Object.values(data)],
			},
		});
		return res?.data;
	}
}

export default new Sheets();
