import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";

export async function generateMetadata({ params }: PageProps) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata.Faq",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid grid-rows-[1fr_auto] min-h-screen w-full fancy-overlay">
			<Header className="fixed top-0 left-0 right-0 mb-0 lg:mb-0 mx-auto z-110 bg-transparent" />
			{children}
		</div>
	);
}
