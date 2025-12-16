"use client";

import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mjs/ui/primitives/empty";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Icons } from "../icons";
import { type EmptyStateProps } from "./types";

export type { EmptyStateProps };

/**
 * A reusable empty state component that displays when there's no data to show.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="file"
 *   title="No documents found"
 *   description="Upload your first document to get started"
 *   action={{
 *     label: "Upload Document",
 *     onClick: () => handleUpload()
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon = "home",
  title = "No data",
  description = "No data found",
  action,
  children,
  className,
  showIcon = true,
  mediaVariant = "icon",
  asCard = false,
}: EmptyStateProps) {
  const renderIcon = (icon: EmptyStateProps["icon"] | null) => {
    if (!icon) return null;

    const iconClassname = "size-8 text-primary";
    // If icon is a string key from Icons object
    if (typeof icon === "string" && icon in Icons) {
      const IconComponent = Icons[icon as keyof typeof Icons];
      return <IconComponent className={iconClassname} />;
    }

    // If icon is a Lucide icon component
    if (typeof icon === "function") {
      const IconComponent = icon;
      return <IconComponent className={iconClassname} />;
    }

    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className="contents"
        layout
      >
        <EmptyStateCard asCard={asCard}>
          <Empty className={cn(className)}>
            {showIcon && icon && (
              <EmptyHeader>
                <EmptyMedia variant={mediaVariant}>
                  {renderIcon(icon)}
                </EmptyMedia>
              </EmptyHeader>
            )}

            {(title || description) && (
              <div className="space-y-1">
                {title && <EmptyTitle>{title}</EmptyTitle>}
                {description && (
                  <EmptyDescription>{description}</EmptyDescription>
                )}
              </div>
            )}
            {(action || children) && <EmptyContent>{children}</EmptyContent>}
            {action && (
              <Button
                className={cn(
                  "text-secondary-300 animate-pulse",
                  action.href && "cursor-pointer",
                )}
                variant={action.variant || "link"}
                size={action.size || "sm"}
                onClick={action.onClick}
                disabled={action.disabled}
                loading={action.loading}
              // asChild={!!action.href}
              >
                {action.href ? (
                  <Link href={action.href}>
                    <div>
                      {action.label} {renderIcon(action.icon || null)}
                    </div>
                  </Link>
                ) : (
                  <span>
                    {action.label} {renderIcon(action.icon || null)}
                  </span>
                )}
              </Button>
            )}
          </Empty>
        </EmptyStateCard>
      </motion.div>
    </AnimatePresence>
  );
}

const EmptyStateCard = ({
  asCard,
  children,
  ...props
}: Pick<EmptyStateProps, "asCard" | "title" | "description" | "className"> & {
  children: React.ReactNode;
}) => {
  if (!asCard) {
    return children;
  }
  return (
    <Card className={cn("max-w-md mx-auto", props.className)}>
      <VisuallyHidden>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          <CardDescription>{props.description}</CardDescription>
        </CardHeader>
      </VisuallyHidden>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
};
