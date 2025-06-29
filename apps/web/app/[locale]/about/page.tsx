import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { JsonLd, createOrganizationJsonLd } from "@/components/JsonLd";

export default function About() {
	return (
		<div className="grid grid-rows-[auto_1fr_auto] min-h-screen w-full fancy-overlay">
			<Header className="mx-auto container" />

			<div className="w-full flex flex-col items-center mb-12">
				<section className="w-full p-6 container-narrow">
					<h1 className="text-4xl font-semibold leading-tight md:leading-tight max-w-xs sm:max-w-none md:text-6xl fancy-heading">
						About Mahjong Stars
					</h1>

					<p className="mt-6 md:text-xl">
						$MJS is the core utility token of Mahjong Stars, enabling NFT
						trading, AI upgrades, tournament access, and revenue staking.
						Participate in a multi-billion dollar Web3 opportunity and fuel the
						first global social mahjong platform with real-world value and AI
						liquidity.
					</p>

					<p className="mt-6 md:text-xl"></p>
					<JsonLd jsonLd={createOrganizationJsonLd()} />
				</section>
			</div>

			<Footer />
		</div>
	);
}
