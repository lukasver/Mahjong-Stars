import clsx from "clsx";
import Image from "next/image";
import React from "react";

export interface ProductCardProps {
	title: string;
	titleComponent?: React.ReactNode;
	description?: string;
	descriptionComponent?: React.ReactNode;
	imageSrc?: string;
	imageAlt?: string;
	actionComponent?: React.ReactNode;
	topComponent?: React.ReactNode;
	bottomComponent?: React.ReactNode;
	featured?: boolean;
	className?: string;
	variant?: "primary" | "secondary" | "default";
	href?: string;
}

/**
 * Product card component that displays product information with image and action button.
 * Supports horizontal layout on mobile and grid layout on larger screens.
 */
export function LandingProductCard({
	title,
	titleComponent,
	description,
	descriptionComponent,
	imageSrc,
	imageAlt = "",
	actionComponent,
	topComponent,
	bottomComponent,
	featured = false,
	className,
	variant = "default",
	href,
}: ProductCardProps) {
	const cardClasses = clsx(
		"group flex flex-row md:flex-col gap-4 p-4 rounded-xl border shadow-xs transition-all duration-200 overflow-hidden h-full",
		featured && "border-2 shadow-md",
		featured &&
			variant === "primary" &&
			"border-primary-500/20 dark:border-primary-700/20",
		featured &&
			variant === "secondary" &&
			"border-secondary-500/20 dark:border-secondary-700/20",
		variant === "default" && "bg-white dark:bg-gray-900",
		variant === "primary" && "bg-primary-100/20 dark:bg-primary-900/10",
		variant === "secondary" && "bg-secondary-100/20 dark:bg-secondary-900/10",
		"hover:shadow-md",
		className,
	);

	const Component = href ? "a" : "div";
	const hrefProps = href ? { href } : {};

	return (
		<Component className={cardClasses} {...hrefProps}>
			{imageSrc && (
				<div className="shrink-0 w-1/3 md:w-full md:h-48 relative rounded-md overflow-hidden">
					<Image
						src={imageSrc}
						alt={imageAlt || title}
						fill
						className="object-cover group-hover:scale-105 transition-all duration-500"
					/>
				</div>
			)}

			{/* Content section */}
			<div className="flex-1 flex flex-col justify-between gap-4">
				{topComponent && <div>{topComponent}</div>}

				<div className="space-y-2">
					{titleComponent || (
						<h3
							className={clsx(
								"text-lg md:text-xl font-medium",
								featured && "font-bold",
							)}
						>
							{title}
						</h3>
					)}

					{descriptionComponent ||
						(description && (
							<p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
								{description}
							</p>
						))}
				</div>

				{bottomComponent && (
					<div className="flex justify-center">{bottomComponent}</div>
				)}

				{actionComponent && (
					<div className="flex justify-center mt-auto pt-2">
						{actionComponent}
					</div>
				)}
			</div>
		</Component>
	);
}
