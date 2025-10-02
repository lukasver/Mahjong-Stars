import "server-only";
import { getLangDir } from "rtl-detect";
import type { Dictionaries, Dictionary, Locale } from ".";

// We enumerate all dictionaries here for better linting and TypeScript support
// We also get the default import for cleaner types
const dictionaries: Dictionaries = {
	en: () => import("@mjs/i18n/docs/en.json"),
	es: () => import("@mjs/i18n/docs/es.json"),
	fr: () => import("@mjs/i18n/docs/fr.json"),
	de: () => import("@mjs/i18n/docs/de.json"),
	it: () => import("@mjs/i18n/docs/it.json"),
	ja: () => import("@mjs/i18n/docs/ja.json"),
	ko: () => import("@mjs/i18n/docs/ko.json"),
	pt: () => import("@mjs/i18n/docs/pt.json"),
	ru: () => import("@mjs/i18n/docs/ru.json"),
	zh: () => import("@mjs/i18n/docs/zh.json"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
	const promise = dictionaries[locale] || dictionaries.en;
	if (!promise) {
		throw new Error(`Dictionary for locale ${locale} not found`);
	}
	const { default: dictionary } = await promise();

	return dictionary;
}

export function getDirection(locale: string | Locale): "ltr" | "rtl" {
	return getLangDir(locale);
}

export const getTranslations = async (lang: Locale) => {
	const dictionary = await getDictionary(lang as Locale);

	const t = (
		key: string,
		values?: { [key: string]: string | number },
	): string => {
		const keys = key.split(".");
		let result: string | Dictionary | undefined = dictionary;

		for (const k of keys) {
			if (typeof result === "object" && result !== null && k in result) {
				// @ts-expect-error fixme
				result = result[k as keyof typeof result] as string | Dictionary;
			} else {
				return key;
			}
		}

		if (typeof result === "string") {
			if (!values) {
				return result;
			}

			return Object.entries(values).reduce(
				(str, [valueKey, value]) => str.replace(`{${valueKey}}`, String(value)),
				result,
			);
		}

		return key;
	};

	return t;
};
