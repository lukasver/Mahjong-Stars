"use client";

import { cn } from "@mjs/ui/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

function Label({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
	VariantProps<typeof labelVariants>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				labelVariants(),
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
