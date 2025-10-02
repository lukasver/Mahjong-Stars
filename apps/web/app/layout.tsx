import "@/css/styles.css";
import { Metadata } from 'next';

export const metadata: Metadata = {
	verification: {
		google: "nqa5sg-1E3L1kkp14czB6bPMFch0O0qwUt1OLHme3lo",
	},
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>
		{children}
	</>;
}
