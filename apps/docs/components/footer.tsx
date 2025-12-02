import { Footer as AppFooter } from "@mjs/ui/components/footer";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { Footer as FooterComponent, LocaleSwitch } from "nextra-theme-docs";
import { Suspense } from "react";
import { Locale } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n/get-dictionaries";
import { metadata as siteConfig } from "@/lib/site-config";

export const Footer = async ({ locale }: { locale: Locale }) => {
	const t = await getTranslations(locale);
	return (
		<FooterComponent className="m-0! p-0! bg-black mx-auto w-full max-w-full!">
			<AppFooter
				links={getFooterLinks(t)}
				copyright={t("Footer.copyright", { year: new Date().getFullYear() })}
				siteConfig={siteConfig}
				element="div"
			>
				<Suspense fallback={<Skeleton className="w-[125px] h-8" />}>
					<LocaleSwitch />
				</Suspense>
			</AppFooter>
		</FooterComponent>
	);
};

const getFooterLinks = (t: (k: string) => string) => {
	return [
		{ href: "/web", title: t("Footer.links.home") },
		// { href: "/", title: t("Footer.links.docs") },
		{ href: "/web/about", title: t("Footer.links.whoWeAre") },
		{ href: "/web/terms", title: t("Footer.links.termsAndConditions") },
		{ href: "/web/privacy", title: t("Footer.links.privacyPolicy") },
		{ href: "/web/contact", title: t("Footer.links.contact") },
	];
};
