import { Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Layout } from "nextra-theme-docs";
import { type ReactNode } from "react";
import { Banner } from "@/components/banner";
// import 'nextra-theme-docs/style.css';
import "@/app/styles.css";
import { getLocaleNames } from "@mjs/i18n";
import { PageMapItem } from "nextra";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/header";
import remotePageMap from "@/data/remote-page-map.json";
import { Locale } from "@/lib/i18n";
import {
	getDictionary,
	getDirection,
	getTranslations,
} from "@/lib/i18n/get-dictionaries";
import { TranslationsProvider } from "@/lib/i18n/provider";
import normalizePageMap from "@/lib/normalize-page-map";

async function layout({
	children,
	params,
}: {
	children: ReactNode;
	params: { lang: string };
}) {
	const aParams = await params;

	const lang = aParams?.lang || "en";

	const [pageMap, t, dictionary] = await Promise.all([
		getPageMap(lang ? `/${lang}` : "/en")
			.then(async (pageMap) =>
				process.env.ENABLE_REMOTE === "true"
					? ([...pageMap, remotePageMap.pageMap] as PageMapItem[])
					: pageMap,
			)
			.then(normalizePageMap(lang as Locale)),
		getTranslations(lang as Locale),
		getDictionary(lang as Locale),
	]);


	return (
		<html
			// Not required, but good for SEO
			lang={lang || "en"}
			// Required to be set
			dir={getDirection(lang) || "ltr"}
		>
			<TranslationsProvider translations={dictionary}>
				<Layout
					i18n={getLocaleNames()}
					banner={<Banner lang={lang as Locale} />}
					navbar={<Navbar lang={lang as Locale} />}
					search={<Search placeholder={t("Global.search")} />}
					sidebar={{
						defaultOpen: true,
						defaultMenuCollapseLevel: 1,
					}}
					pageMap={pageMap}
					editLink={false}
					docsRepositoryBase="https://github.com/mahjongstars/docs"
					footer={<Footer locale={lang as Locale} />}
					navigation={true}
				>
					{children}
				</Layout>
			</TranslationsProvider>
		</html>
	);
}

export default layout;
