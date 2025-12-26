import { Skeleton } from "@mjs/ui/primitives/skeleton";

export function FundraisingProgressLoading() {
	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-6 sm:h-8 w-48 sm:w-64 max-w-full" />
				<Skeleton className="h-4 sm:h-5 w-36 sm:w-48 max-w-full" />
			</div>

			<div className="space-y-3 sm:space-y-4">
				<div className="flex items-end gap-2 flex-wrap">
					<Skeleton className="h-10 sm:h-12 w-32 sm:w-48 max-w-full" />
					<Skeleton className="h-5 sm:h-6 w-16 sm:w-24 max-w-full" />
					<div className="ml-auto">
						<Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
					</div>
				</div>
				<Skeleton className="h-3 w-full rounded-full" />
			</div>
		</div>
	);
}
