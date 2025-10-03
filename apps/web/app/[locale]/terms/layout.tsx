import { cn } from "@mjs/ui/lib/utils";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";

export async function generateMetadata({ params }: PageProps) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata.Terms",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default function TermsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className={cn("w-full")}>
			<Header className="fixed top-0 left-0 right-0 mb-0 lg:mb-0 mx-auto z-110 bg-transparent" />
			<main className="mx-auto prose lg:prose-xl mt-20 xs:mt-28 p-4 prose-a:fancy-link prose-h2:text-2xl prose-h1:text-4xl">
				{children}
			</main>
		</div>
	);
}
