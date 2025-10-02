import "@/css/styles.css";
import { Metadata } from 'next';

export const metadata: Metadata = {
	verification: {
		google: "nqa5sg-1E3L1kkp14czB6bPMFch0O0qwUt1OLHme3lo",
		yahoo: 'FF50A7E49E3FA26ACB3E48EF51D8D106',
		// yandex: '',
		other: {
			// Bing
			"msvalidate.01": ['FF50A7E49E3FA26ACB3E48EF51D8D106']
		}
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
