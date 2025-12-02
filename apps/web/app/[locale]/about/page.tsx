import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Background from "@/public/static/images/bg.webp";
import Characters from "@/public/static/images/chars1.webp";
import AboutSection from "./about";

export async function generateMetadata({ params }: PageProps) {
	const { locale } = await params;
	const t = await getTranslations({
		locale: locale || "en",
		namespace: "Metadata.About",
	});
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function About({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const [{ locale }, t] = await Promise.all([params, getTranslations()]);
	return (
		<div className="flex flex-col w-full items-center mb-40">
			<main
				className={cn(
					"grid",
					`[&>section]:min-h-screen [&>section]:h-full [&>section]:md:py-20 [&>section]:py-12 [&>section]:px-4`,
				)}
			>
				<section
					id="home"
					className={cn(
						"relative",
						// 'after:absolute after:inset-0 after:-z-[1] after:bg-gradient-to-b after:from-transparent after:from-10% after:via-transparent after:to-primary',
						"overflow-x-hidden",
					)}
				>
					<div className="mx-auto z-1 h-full grid place-items-center">
						<div
							id={"hero-characters"}
							className="grid grid-cols-1 md:grid-cols-6 grid-rows-3 h-full md:h-auto"
						>
							<div className="flex flex-col gap-4 col-start-1 col-end-2 md:col-start-2 md:col-end-6 row-start-1 row-end-4 md:row-start-2 md:row-end-4 z-10 justify-center-safe">
								<h1 className="font-head text-4xl lg:text-7xl text-center [&>span]:block">
									{t.rich("Hero.title", {
										span: (chunks) => <span>{chunks}</span>,
									})}
								</h1>
								<h2 className="text-xl md:text-2xl text-center font-common font-medium">
									{t("Hero.subtitle")}
								</h2>
								<Link
									href={`/${locale === "en" ? "" : `${locale}/`}#newsletter`}
								>
									<Button className="w-full max-w-md mx-auto uppercase font-bold animate-pulse">
										{t("Newsletter.button2")}
									</Button>
								</Link>
							</div>
							<Image
								{...Characters}
								alt="hero-characters"
								priority
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
								className={cn(
									"w-full h-full object-contain lg:object-cover z-1 col-start-1 col-end-2 md:col-start-1 md:col-end-7 row-start-1 row-end-4 -mt-20 animate-fade-in-down-slow 2xl:scale-75",
									"md:scale-125",
								)}
								style={{
									maskImage:
										'linear-gradient(to bottom, black 80%, transparent 100%)',
								}}
							/>
						</div>
					</div>
					<Image
						alt="bg"
						className="w-full h-full fixed inset-0"
						priority
						// fill
						sizes="100vw"
						style={{
							objectFit: "cover",
							zIndex: -1,
						}}
						{...Background}
					/>
				</section>
				<Suspense fallback={null}>
					<AboutSection />
				</Suspense>
			</main>
		</div>
	);
}
