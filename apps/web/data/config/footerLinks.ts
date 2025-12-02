import { Locale } from "next-intl";

export const getFooterLinks = (
	t: (k: string) => string,
	locale?: Locale,
): Array<{
	href: string;
	title: string;
}> => {
	return [
		{ href: "#home", title: t("Footer.links.home") },
		// {
		// 	href: `/${locale ? `${locale}/` : ""}docs`,
		// 	title: t("Footer.links.docs"),
		// },
		{ href: "/about", title: t("Footer.links.whoWeAre") },
		{ href: "/terms", title: t("Footer.links.termsAndConditions") },
		{ href: "/privacy", title: t("Footer.links.privacyPolicy") },
		{ href: "/contact", title: t("Footer.links.contact") },
	];
};
