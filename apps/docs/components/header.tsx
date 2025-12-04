// import { RainbowButton } from '@mjs/ui/components/rainbow-button';
import {
	LocaleSwitch,
	Navbar as NavbarComponent,
	ThemeSwitch,
} from "nextra-theme-docs";
import { Locale } from "@/lib/i18n";
import { Logo } from "./logo";

export const Navbar = async ({ lang }: { lang: Locale }) => {
	// const t = await getTranslations(lang);
	return (
		<NavbarComponent
			className="bg-primary dark:bg-primary"
			// projectLink='https://github.com/mahjongstars/docs'
			logo={<Logo />}

		// chatIcon={<Icons.discord className='w-5 h-5' />}
		// projectIcon={<Icons.boxes className='w-5 h-5' />}
		// ... Your additional navbar options
		>
			{/* <Link
				href={applyUTM(
					`/web/${lang && lang !== "en" ? `${lang}/` : ""}#newsletter`,
					{
						source: "docs",
						medium: "header",
						campaign: "newsletter_signup",
						content: "cta_button",
					},
				)}
			>
				<ShinyButton className="bg-accent font-head aspect-square size-[38px] md:size-auto md:aspect-auto md:px-6 md:py-2 px-2 py-2">
					<span className="hidden md:block">{t("Global.subscribe")}</span>
					<Icons.subscribe className="md:hidden size-5!" />
				</ShinyButton>
			</Link> */}
			<LocaleSwitch lite className="text-white!" />
			<ThemeSwitch lite className="text-white!" />
		</NavbarComponent>
	);
};
