import { cn } from "@mjs/ui/lib/utils";
import * as React from "react";

export const getInputClass = (className?: string) => {
  return cn(
    "flex h-10 w-full rounded-md",
    "border-none bg-secondary-600/50 backdrop-blur-xs",
    "px-3 py-2",
    "text-base md:text-sm text-foreground",
    `shadow shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]`,
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    "placeholder:text-foreground/70",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-800 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { icon?: React.ReactNode }>(
  ({ className, type, onWheel, ...props }, ref) => {
    const { icon, ...rest } = props;

    return (
      <WithIcon icon={icon}>
        <input
          type={type}
          className={cn(getInputClass(), icon && "pl-10", className)}
          ref={ref}
          onWheel={(e) => {
            // e.preventDefault();
            // Fix to involuntary number change when scrolling
            if (type === "number") {
              (document?.activeElement as HTMLElement)?.blur();
            }
            onWheel?.(e);
          }}
          {...rest}
        />
      </WithIcon>
    );
  },
);
Input.displayName = "Input";

const WithIcon = ({
  icon,
  children,
}: React.ComponentProps<"input"> & { icon: React.ReactNode }) => {
  if (!icon) {
    return children;
  }
  return (
    <div className="relative">
      <div className="z-50 absolute left-2 top-1/2 -translate-y-1/2">{icon}</div>
      {children}
    </div>
  );
};

export { Input };
