import { type ButtonProps } from "@mjs/ui/primitives/button";

import { type LucideIcon } from "lucide-react";
import { LinkProps } from "next/link";
import { type ReactNode } from "react";
import { Icons } from "../icons";

export interface EmptyStateProps {
  /**
   * The icon to display in the empty state
   * Can be a Lucide icon component or a string key from the Icons object
   */
  icon?: keyof typeof Icons | LucideIcon;
  /**
   * The title text for the empty state
   */
  title?: string;
  /**
   * The description text for the empty state
   */
  description?: string;
  /**
   * The action button configuration
   */
  action?: {
    label: string;
    onClick?: () => void;
    href?: LinkProps<string>["href"];
    variant?: ButtonProps["variant"];
    size?: ButtonProps["size"];
    loading?: boolean;
    disabled?: boolean;
    icon?: EmptyStateProps["icon"];
    linkProps?: React.ComponentProps<"a">;
  };
  /**
   * Custom content to render in the empty state
   */
  children?: ReactNode;
  /**
   * Additional CSS classes for the empty state container
   */
  className?: string;
  /**
   * Whether to show the icon with the default icon variant styling
   * @default true
   */
  showIcon?: boolean;
  /**
   * The variant for the empty media (icon container)
   * @default "icon"
   */
  mediaVariant?: "default" | "icon";
  /**
   * Whether to render the empty state as a card
   * @default false
   */
  asCard?: boolean;
}
