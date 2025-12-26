import { Skeleton } from "@mjs/ui/primitives/skeleton";

export function TokenMetricsLoading() {
	return (
		<div className="bg-card rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 border border-border">
			<div className="space-y-2">
				<Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
				<Skeleton className="h-3 sm:h-4 w-40 sm:w-48 max-w-full" />
			</div>
			<div className="space-y-2 sm:space-y-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex justify-between gap-2">
						<Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
						<Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
					</div>
				))}
			</div>
		</div>
	);
}
