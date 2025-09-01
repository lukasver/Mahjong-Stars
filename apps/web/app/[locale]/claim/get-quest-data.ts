import "server-only";
import { invariant } from "@epic-web/invariant";
import { cache } from "react";
import { questParser } from "@/components/claim/types";
import sheets from "@/lib/sheets";

export const getQuestData = cache(async (id: string) => {
	try {
		const questsSheetId = process.env.GOOGLE_SHEET_ID;
		invariant(questsSheetId, "GOOGLE_SHEET_ID is not set");
		const { data, headers } = await sheets.getValues(questsSheetId);
		const quest = data.find((row) => row[0] === id);
		invariant(quest, "Quest not found");

		const parsed = questParser.parse(
			headers?.reduce(
				(acc, header, index) => {
					acc[header] = quest[index] ?? "";
					return acc;
				},
				{} as Record<string, string>,
			),
		);

		if (parsed.expiration) {
			const expirationDate = parsed.expiration;
			const currentDate = new Date();
			if (expirationDate < currentDate) {
				console.debug("Quest is expired");
				return null;
			}
		}

		return parsed;
	} catch (e) {
		console.error(e);
		return null;
	}
});
