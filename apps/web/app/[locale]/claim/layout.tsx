import { cn } from "@mjs/ui/lib/utils";

export default function ContactLayout({
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
