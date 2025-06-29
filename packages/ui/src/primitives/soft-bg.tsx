import clsx from "clsx";
// @ts-expect-error fixme
import style from "./soft-bg.module.css";
/* Configure colors at https://shipixen.com/color-theme-explorer-shadcn */
const defaultColors = {
	primary: {
		lighter: "#f675a7",
		light: "#f45196",
		main: "#e52679",
		dark: "#c7205a",
		darker: "#9c1854",
	},
	secondary: {
		lighter: "#9ca3af",
		light: "#6b7280",
		main: "#4b5563",
		dark: "#374151",
		darker: "#1f2937",
	},
};

export const SoftBg = ({
	className,
	variant,
	animationDelay,
	...props
}: {
	className?: string;
	variant?: "primary" | "secondary";
	animationDelay?: number;
	colors?: typeof defaultColors;
}) => {
	const colors = props.colors || defaultColors;

	const stopColor =
		variant === "primary" ? colors.primary.lighter : colors.secondary.lighter;
	const stopColorTwo =
		variant === "primary" ? colors.primary.darker : colors.secondary.darker;

	const delay = animationDelay || 0;

	return (
		<svg
			viewBox="0 0 1108 632"
			aria-hidden="true"
			className={clsx(
				className,
				style.container,
				"absolute top-0 left-0 -z-10 w-full h-full max-w-none transform-gpu blur-3xl",
			)}
			style={{
				animationDelay: `${delay}s`,
			}}
		>
			<path
				className={clsx(style.path)}
				style={{
					animationDelay: `${delay}s`,
				}}
				fill={`url(#softbg-${variant})`}
				fillOpacity="0.5"
				d="M235.233 402.609 57.541 321.573.83 631.05l234.404-228.441 320.018 145.945c-65.036-115.261-134.286-322.756 109.01-230.655C968.382 433.026 1031 651.247 1092.23 459.36c48.98-153.51-34.51-321.107-82.37-385.717L810.952 324.222 648.261.088 235.233 402.609Z"
			></path>
			<defs>
				<linearGradient
					id={`softbg-${variant}`}
					x1="1220.59"
					x2="-85.053"
					y1="432.766"
					y2="638.714"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor={stopColor} stopOpacity="1"></stop>
					<stop offset="1" stopColor={stopColorTwo} stopOpacity="1"></stop>
				</linearGradient>
			</defs>
		</svg>
	);
};
