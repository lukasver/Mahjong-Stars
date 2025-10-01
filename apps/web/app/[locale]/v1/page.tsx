import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import CharactersCarousel from "@/components/CharactersCarousel";
import Footer from "@/components/Footer";
import { GameVariants } from "@/components/GameVariants";
import Header from "@/components/Header";
import Image from "@/components/Image";
import { IngameFeatures } from "@/components/IngameFeatures";
import Link from "@/components/Link";
import { LandingNewsletterSection } from "@/components/landing/newsletter/LandingNewsletterSection";
import { LandingSocialProof } from "@/components/landing/social-proof/LandingSocialProof";
import Background from "@/public/static/images/bg.webp";
import Characters from "@/public/static/images/chars1.webp";

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const [{ locale }, t] = await Promise.all([params, getTranslations()]);
	if (process.env.NODE_ENV === "production") {
		// Should not be accesible in prod
		notFound();
	}
	return (
		<div className="flex flex-col w-full items-center fancy-overlay">
			<div className={cn("w-full")}>
				<Header
					className="fixed top-0 left-0 right-0 mb-0 lg:mb-0 mx-auto z-110 bg-transparent"
					home
				/>
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
							"after:absolute after:inset-0 after:-z-[1] after:bg-gradient-to-b after:from-transparent after:from-10% after:via-transparent after:to-primary",
							"overflow-x-hidden md:overflow-x-auto",
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
									<Link href={"#newsletter"}>
										<Button className="w-full max-w-md mx-auto uppercase font-bold animate-pulse">
											{/* {t('Navigation.buttons.playNow')} */}
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
											"linear-gradient(to bottom, black 80%, transparent 100%)",
									}}
								/>
							</div>
						</div>
						<Image
							alt="bg"
							className="w-full h-full absolute inset-0"
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
					</section>

					<section
						id="game"
						className="container mx-auto gap-12 flex flex-col justify-center items-center min-h-[70dvh]!"
					>
						<p className="text-3xl uppercase font-bold text-center font-common">
							{t("GameVariants.title")}
						</p>
						<Suspense fallback={null}>
							<GameVariants />
						</Suspense>
					</section>

					<section
						id="characters"
						className={cn("relative bg-transparent! grid place-items-center")}
					>
						<div className="container mx-auto flex flex-col gap-4">
							<p className="text-3xl uppercase font-bold text-center mb-4 font-common">
								{t("Characters.title")}
							</p>
							<Suspense fallback={null}>
								<div className="relative max-w-[90%] mx-auto">
									<CharactersCarousel />
								</div>
							</Suspense>
							<div className="flex flex-col items-center justify-center h-40 w-full gap-4">
								{/* <Tooltip content={t('Global.soon')}> */}
								{/* <span className='w-full max-w-80'> */}
								<Link href={"#newsletter"} className="max-w-80 w-full">
									<Button className="w-full">
										{/* {t("CTAs.logIn")} */}
										{t("Newsletter.button2")}
									</Button>
								</Link>
								{/* </span> */}
								{/* </Tooltip> */}
								<p className="font-common font-base text-2xl">
									{t("CTAs.findMoreCharacters")}
								</p>
							</div>
						</div>
						<div
							className={cn(
								"w-full h-full absolute inset-0 bg-repeat -z-1 bg-[url(/static/images/bg2.webp)]",
								"gradient-y-primary",
							)}
						/>
					</section>

					<div id="newsletter">
						<LandingNewsletterSection
							title={t("Newsletter.title")}
							description={t("Newsletter.description")}
							buttonLabel={t("Newsletter.button")}
							placeholderLabel={t("Newsletter.placeholder")}
						>
							<LandingSocialProof
								className="mt-6 w-full flex justify-center"
								numberOfUsers={99}
								avatarItems={[
									{
										imageSrc: "/static/images/people/1.webp",
										name: "Mrs Chen",
									},
									{
										imageSrc: "/static/images/people/2.webp",
										name: "Tony Kong",
									},
									{
										imageSrc: "/static/images/people/3.webp",
										name: "Uncle Cai",
									},
									{
										imageSrc: "/static/images/people/4.webp",
										name: "Rob Doe",
									},
								]}
							>
								<p className="text-sm">{t("Newsletter.footer")}</p>
							</LandingSocialProof>
						</LandingNewsletterSection>
					</div>
				</main>
				<Footer locale={locale} />
			</div>
		</div>
	);
}
