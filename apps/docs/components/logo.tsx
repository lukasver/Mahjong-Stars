import { cn } from "@mjs/ui/lib/utils";
import Image from "next/image";
import TheTilesCompanyLogo from "@/public/wt.webp";

export const Logo = ({ className }: { className?: string }) => {
	const { blurHeight: _, blurWidth: __, ...rest } = TheTilesCompanyLogo;
	return (
		<figure className={cn(className, "dark:bg-none")}>
			<Image
				alt="The Tiles Company Logo"
				{...rest}
				height={80}
				width={100}
				priority
			/>
		</figure>
	);
};
