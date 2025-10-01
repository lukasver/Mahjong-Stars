import { cn } from "@mjs/ui/lib/utils";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { IngameFeatures } from "@/components/IngameFeatures";
import { createOrganizationJsonLd, JsonLd } from "@/components/JsonLd";

async function AboutSection() {
	const [t] = await Promise.all([getTranslations()]);
	return (
		<section
			id="features"
			className={cn("container mx-auto flex flex-col gap-4")}
		>
			<div className="grid place-items-center min-h-[50dvh]">
				<div className="max-w-5xl">
					<h2 className="font-semibold text-4xl md:text-5xl text-center mb-4">
						{t("About.title")}
					</h2>
					<p className="text-xl md:text-2xl text-center font-common font-base">
						{t("About.description")}
					</p>
				</div>
			</div>
			<p className="text-3xl uppercase font-bold text-center mb-4 font-common">
				{t("GameFeatures.title")}
			</p>
			<Suspense fallback={null}>
				<IngameFeatures />
			</Suspense>
			<JsonLd jsonLd={createOrganizationJsonLd(t)} />
		</section>
	);
}

export default AboutSection;
