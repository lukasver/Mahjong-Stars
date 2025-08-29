import { cn } from "@mjs/ui/lib/utils";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { MessageSquare, X } from "lucide-react";

export default function Loading() {
	return (
		<div className="min-h-screen bg-transparent flex items-center justify-center p-4">
			{/* Main content container */}
			<div
				className={cn(
					"bg-red-900 border border-red-800 text-white max-w-2xl w-full sm:max-w-[500px] z-50 relative rounded-lg p-6 shadow-lg",
				)}
			>
				{/* Close button */}
				<button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
					<X className="h-5 w-5" />
				</button>

				{/* Header section */}
				<div className="flex flex-col gap-2 text-center sm:text-left mb-6">
					<div className="flex items-center gap-2 text-lg leading-none font-semibold">
						<MessageSquare className="h-5 w-5" />
						<Skeleton className="h-8 w-40 bg-red-800" />
					</div>
					<div className="text-white text-sm">
						<Skeleton className="h-5 w-64 bg-red-800" />
					</div>
				</div>

				{/* Form fields */}
				<div className="space-y-2">
					{/* Promo Code field */}
					<div className="space-y-2">
						<Skeleton className="h-4 w-24 bg-red-800" />
						<div className="flex items-center gap-3 bg-red-800 rounded-md p-3">
							<Skeleton className="h-5 w-5 bg-red-700" />
							<Skeleton className="h-5 w-48 bg-red-700" />
						</div>
					</div>

					{/* Wallet Address field */}
					<div className="space-y-2">
						<Skeleton className="h-4 w-28 bg-red-800" />
						<Skeleton className="h-12 w-full bg-red-800 rounded-md" />
					</div>

					{/* Email field */}
					<div className="space-y-2">
						<Skeleton className="h-4 w-16 bg-red-800" />
						<div className="flex items-center gap-3 bg-red-800 rounded-md p-3">
							<Skeleton className="h-5 w-5 bg-red-700" />
							<Skeleton className="h-5 w-48 bg-red-700" />
						</div>
					</div>

					{/* Twitter handle field */}
					<div className="space-y-2">
						<Skeleton className="h-4 w-28 bg-red-800" />
						<div className="flex items-center gap-3 bg-red-800 rounded-md p-3">
							<Skeleton className="h-5 w-5 bg-red-700" />
							<Skeleton className="h-5 w-48 bg-red-700" />
						</div>
					</div>

					{/* CAPTCHA section */}
					<div className="border border-red-800 rounded-md p-4 bg-red-900">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Skeleton className="h-6 w-6 bg-red-800" />
								<Skeleton className="h-4 w-32 bg-red-800" />
							</div>
							<div className="flex flex-col items-end gap-1">
								<Skeleton className="h-8 w-8 rounded-full bg-red-800" />
								<Skeleton className="h-3 w-24 bg-red-800" />
							</div>
						</div>
					</div>

					{/* Submit button */}
					<div className='rounded-3xl!'>
						<Skeleton className="h-12 w-full bg-gradient-to-r from-blue-600 via-green-500 to-orange-500 rounded-3xl" />
					</div>

					{/* Footer text */}
					<div className="text-center">
						<Skeleton className="h-5 w-80 bg-red-800 mx-auto" />
					</div>

					{/* Social media icons */}
					<div className="flex justify-center gap-6">
						<Skeleton className="h-8 w-8 rounded-full bg-red-800" />
						<Skeleton className="h-8 w-8 rounded-full bg-red-800" />
					</div>
				</div>
			</div>

			{/* Background pattern */}
			<div
				className={cn(
					"w-full h-full absolute inset-0 bg-repeat -z-1 bg-[url(/static/images/bg2.webp)]",
					"gradient-y-primary",
					"after:absolute after:inset-0 after:bg-gradient-to-t after:from-primary/80 after:from-5% after:to-transparent",
				)}
			/>
			<div id="overlay" className="fixed inset-0 z-50 bg-black/50" />
		</div>
	);
}

