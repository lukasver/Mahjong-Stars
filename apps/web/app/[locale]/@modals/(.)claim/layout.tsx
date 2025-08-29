import { FixModalCloseBug } from "./modal-container";

export default async function ContactLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<FixModalCloseBug expectedPath="/claim">{children}</FixModalCloseBug>
	);
}
