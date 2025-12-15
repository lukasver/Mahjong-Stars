"use client";

import { motion } from "@mjs/ui/components/motion";
import { cn } from "@mjs/ui/lib/utils";
import Image from "next/image";
import MahjongStarsLogo from "@/public/static/images/logo-wt.webp";
import MahjongStarsIconXl from "@/public/static/images/logos/isologo.webp";
import MahjongStarsIcon from "@/public/static/images/logos/isologo-min.webp";

const variantMapping = {
  logo: MahjongStarsLogo,
  icon: MahjongStarsIcon,
  iconXl: MahjongStarsIconXl,
};

export const Logo = ({
  variant = "logo",
  className,
  imageProps,
}: {
  variant?: "logo" | "icon" | "iconXl";
  className?: string;
  imageProps?: Omit<React.ComponentProps<typeof Image>, "alt" | "src">;
}) => {
  const {
    blurHeight: _,
    blurWidth: __,
    ...rest
  } = variantMapping[variant as keyof typeof variantMapping];
  return (
    <figure className={cn(className, "dark:bg-none")}>
      <Image
        alt="The Tiles company Logo"
        {...rest}
        height={80}
        width={100}
        priority
        {...imageProps}
      />
    </figure>
  );
};

/**
 * Animated wrapper for the Logo component
 * Provides spring animations and hover effects for gaming-style interactions
 */
export const LogoAnimate = ({
  children,
  animation = "springBounce",
  delay = 0,
  className,
  ...motionProps
}: {
  children: React.ReactNode;
  animation?: "springBounce" | "slideUp" | "fadeIn" | "custom";
  delay?: number;
  className?: string;
} & Partial<React.ComponentProps<typeof motion.div>>) => {
  const getAnimationProps = () => {
    switch (animation) {
      case "springBounce":
        return {
          initial: { scale: 0, rotate: -180, opacity: 0 },
          animate: { scale: 1, rotate: 0, opacity: 1 },
          transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 15,
            mass: 1,
            duration: 0.8,
            delay,
          },
          whileHover: {
            scale: 1.1,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.3 },
          },
        };
      case "slideUp":
        return {
          initial: { y: 50, opacity: 0, scale: 0.8 },
          animate: { y: 0, opacity: 1, scale: 1 },
          transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 12,
            delay,
            duration: 0.6,
          },
          whileHover: {
            scale: 1.05,
            transition: { duration: 0.2 },
          },
        };
      case "fadeIn":
        return {
          initial: { y: 30, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: {
            type: "spring" as const,
            stiffness: 80,
            damping: 10,
            delay,
            duration: 0.5,
          },
        };
      default:
        return {};
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div className={className} {...animationProps} {...motionProps}>
      {children}
    </motion.div>
  );
};
