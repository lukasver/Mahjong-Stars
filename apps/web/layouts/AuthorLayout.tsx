import Image from "@/components/Image";
import { Button } from "@mjs/ui/primitives/button";
import type { Authors } from "contentlayer/generated";
import { ReactNode } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { GithubIcon, LinkedinIcon, MailIcon, TwitterIcon } from "lucide-react";
interface Props {
	children: ReactNode;
	content: Omit<Authors, "_id" | "_raw" | "body">;
}

export default function AuthorLayout({ children, content }: Props) {
	const {
		name,
		avatar,
		occupation,
		company,
		email,
		twitter,
		linkedin,
		github,
	} = content;

	return (
		<div className="flex flex-col w-full items-center">
			<Header />

			<div className="divide-y divide-gray-200 dark:divide-gray-700">
				<div className="space-y-2 pb-8 pt-6 md:space-y-5">
					<h1 className="text-3xl font-semibold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
						About
					</h1>
				</div>
				<div className="items-start space-y-2 xl:grid xl:grid-cols-3 xl:gap-x-8 xl:space-y-0">
					<div className="flex flex-col items-center space-x-2 pt-8">
						{avatar && (
							<Image
								src={avatar}
								alt="avatar"
								width={192}
								height={192}
								className="h-48 w-48 rounded-full"
							/>
						)}
						<h3 className="pb-2 pt-4 text-2xl font-bold leading-8 tracking-tight">
							{name}
						</h3>
						<div className="text-gray-500 dark:text-gray-400">{occupation}</div>
						<div className="text-gray-500 dark:text-gray-400">{company}</div>
						<div className="flex space-x-3 pt-6">
							{email && (
								<a href={`mailto:${email}`}>
									<Button variant="outline" size="icon">
										<MailIcon className="w-6 h-6" />
									</Button>
								</a>
							)}

							{github && (
								<a href={github}>
									<Button variant="outline" size="icon">
										<GithubIcon className="w-6 h-6" />
									</Button>
								</a>
							)}

							{linkedin && (
								<a href={linkedin}>
									<Button variant="outline" size="icon">
										<LinkedinIcon className="w-6 h-6" />
									</Button>
								</a>
							)}

							{twitter && (
								<a href={twitter}>
									<Button variant="outline" size="icon">
										<TwitterIcon className="w-6 h-6" />
									</Button>
								</a>
							)}
						</div>
					</div>
					<div className="prose max-w-none pb-8 pt-8 dark:prose-invert xl:col-span-2">
						{children}
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
}
