import { cn } from "@mjs/ui/lib/utils";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: PageProps) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata.Contact",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function ContactLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen w-full">
			{children}
			<div
				className={cn(
					"w-full h-full absolute inset-0 bg-repeat -z-1 bg-[url(/static/images/bg2.webp)]",
					"gradient-y-primary",
				)}
			/>
		</div>
	);
}
