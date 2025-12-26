import { Skeleton } from "@mjs/ui/primitives/skeleton";

export function IcoPhasesLoading() {
	return (
		<div className="bg-card rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 border border-border">
			<div className="space-y-2">
				<Skeleton className="h-5 sm:h-6 w-24 sm:w-28" />
				<Skeleton className="h-3 sm:h-4 w-36 sm:w-44 max-w-full" />
			</div>
			<div className="space-y-2 sm:space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<div className="flex justify-between gap-2">
							<Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
							<Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
						</div>
						<Skeleton className="h-2 w-full rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
}
