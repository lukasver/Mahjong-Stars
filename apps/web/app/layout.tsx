import "@/css/styles.css";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>
		{children}
	</>;
}
