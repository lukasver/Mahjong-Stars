"use client";

import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
  X,
} from "lucide-react";
import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react";
import React from "react";

/**
 * Banner component variants using class-variance-authority
 */
const bannerVariants = cva(
  "relative w-full rounded-lg border p-4 shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600",
        success:
          "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800",
        warning:
          "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800",
        error:
          "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800",
        info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800",
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

/**
 * Icon variants for different banner types
 */
const iconVariants = cva("flex-shrink-0", {
  variants: {
    variant: {
      default: "text-foreground",
      success: "text-green-600 dark:text-green-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      error: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
    },
    size: {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

/**
 * Default icons for each banner variant
 */
const defaultIcons: Record<string, LucideIcon> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  default: Info,
};

export interface BannerProps
  extends HTMLMotionProps<"div">,
  VariantProps<typeof bannerVariants> {
  /**
   * Banner message content
   */
  message: string | React.ReactNode;
  /**
   * Optional title for the banner
   */
  title?: string;
  /**
   * Custom icon component
   */
  icon?: LucideIcon;
  /**
   * Whether to show the close button
   */
  closable?: boolean;
  /**
   * Callback when close button is clicked
   */
  onClose?: () => void;
  /**
   * Whether the banner is visible
   */
  visible?: boolean;
  /**
   * Animation duration in seconds
   */
  animationDuration?: number;
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  };
  /**
   * Secondary action button configuration
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  };
}

/**
 * Reusable Banner component with Shadcn UI styling and Motion animations
 *
 * @example
 * ```tsx
 * <Banner
 *   variant="success"
 *   message="Your transaction was completed successfully!"
 *   title="Success"
 *   closable
 *   onClose={() => console.log('Banner closed')}
 * />
 * ```
 */
export const Banner = ({
  message,
  title,
  icon: Icon,
  variant = "default",
  size = "md",
  closable = false,
  onClose,
  visible = true,
  animationDuration = 0.3,
  action,
  secondaryAction,
  className,
  ...props
}: BannerProps) => {
  const DefaultIcon = Icon || defaultIcons[variant || "default"];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: animationDuration,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={cn(bannerVariants({ variant, size }), className)}
          role="alert"
          {...props}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: animationDuration * 0.2,
                duration: animationDuration * 0.6,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className={cn(iconVariants({ variant, size }))}
            >
              {DefaultIcon && <DefaultIcon />}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: animationDuration * 0.3,
                  duration: animationDuration * 0.5,
                }}
              >
                {title && (
                  <h4 className="font-semibold leading-tight mb-1">{title}</h4>
                )}
                <p className="leading-relaxed">{message}</p>
              </motion.div>

              {/* Action Buttons */}
              {(action || secondaryAction) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: animationDuration * 0.5,
                    duration: animationDuration * 0.4,
                  }}
                  className="flex gap-2 mt-3"
                >
                  {action && (
                    <Button
                      size="sm"
                      variant={action.variant || "outline"}
                      onClick={action.onClick}
                      className="h-8"
                    >
                      {action.label}
                    </Button>
                  )}
                  {secondaryAction && (
                    <Button
                      size="sm"
                      variant={secondaryAction.variant || "ghost"}
                      onClick={secondaryAction.onClick}
                      className="h-8"
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Close Button */}
            {closable && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: animationDuration * 0.4,
                  duration: animationDuration * 0.3,
                }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                  aria-label="Close banner"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Banner with pulsing animation for attention-grabbing messages
 */
export const PulsingBanner = ({
  message,
  title,
  icon: Icon,
  variant = "warning",
  size = "md",
  className,
  ...props
}: Omit<BannerProps, "animationDuration">) => {
  const DefaultIcon = Icon || defaultIcons[variant || "warning"];

  return (
    <motion.div
      animate={{
        scale: [1, 1.02, 1],
        boxShadow: [
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(bannerVariants({ variant, size }), className)}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className={cn(iconVariants({ variant, size }))}>
          {DefaultIcon && <DefaultIcon />}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold leading-tight mb-1">{title}</h4>
          )}
          <p className="leading-relaxed">{message}</p>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Banner with slide-in animation from the top
 */
export const SlideInBanner = ({
  message,
  title,
  icon: Icon,
  variant = "info",
  size = "md",
  className,
  ...props
}: Omit<BannerProps, "animationDuration">) => {
  const DefaultIcon = Icon || defaultIcons[variant || "info"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.6,
      }}
      className={cn(bannerVariants({ variant, size }), className)}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 20,
          }}
          className={cn(iconVariants({ variant, size }))}
        >
          {DefaultIcon && <DefaultIcon />}
        </motion.div>
        <div className="flex-1 min-w-0">
          {title && (
            <motion.h4
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="font-semibold leading-tight mb-1"
            >
              {title}
            </motion.h4>
          )}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="leading-relaxed"
          >
            {message}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
