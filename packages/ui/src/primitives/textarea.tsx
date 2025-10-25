import { cn } from "@mjs/ui/lib/utils";
import * as React from "react";

// Replace the empty interface with a type alias
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-md",
					"border-none bg-secondary-600/50 backdrop-blur-xs",
					"px-3 py-2",
					"text-base md:text-sm text-foreground",
					`shadow shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]`,
					"placeholder:text-foreground/70",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-800 focus-visible:ring-offset-2",
					"disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			>
				{props.children}
			</textarea>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
