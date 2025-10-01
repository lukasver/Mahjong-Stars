import { cn } from "@mjs/ui/lib/utils";
import { getTranslations } from "next-intl/server";
import { createClaimRewardsJsonLd, JsonLd } from "@/components/JsonLd";

interface PageProps {
	params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata.Claim",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function ClaimLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata.Claim",
	});

	return (
		<div className="relative min-h-screen w-full">
			{children}
			<div
				className={cn(
					"w-full h-full absolute inset-0 bg-repeat -z-1 bg-[url(/static/images/bg2.webp)]",
					"gradient-y-primary",
				)}
			/>
			<JsonLd jsonLd={createClaimRewardsJsonLd(t)} />
		</div>
	);
}
