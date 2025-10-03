import { notFound } from "next/navigation";
import Header from "@/components/Header";

export default function PricingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Not implemented yet
	notFound();
	return (
		<div className="flex flex-col w-full items-center fancy-overlay">
			<Header />
			{children}
		</div>
	);
}
