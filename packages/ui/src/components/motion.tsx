"use client";

import {
  AnimatePresence,
  motion,
  type UseInViewOptions,
  useInView,
  type Variants,
} from "motion/react";

export function EnterAnimation({
  children,
  delay = 0,
  className,
  duration = 0.4,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration,
        scale: { type: "spring", visualDuration: duration, bounce: 0.5 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeAnimation({
  children,
  delay = 0,
  className,
  duration = 0.2,
  ease = "easeOut",
  scale = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
  ease?: string;
  scale?: boolean;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        ...(scale && { scale: 0.95 }),
      }}
      animate={{
        opacity: 1,
        ...(scale && { scale: 1 }),
      }}
      transition={{
        delay: delay * 0.5,
        duration: duration,
        ease: ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LoadingAnimation({
  children,
  className,
  duration = 1.5,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealAnimation({
  children,
  isVisible,
  className,
  duration = 0.4,
  staggerDelay = 0.1,
  iconScaleDelay = 0.2,
  textSlideDelay = 0.25,
}: {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
  duration?: number;
  staggerDelay?: number;
  iconScaleDelay?: number;
  textSlideDelay?: number;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={isVisible ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
      transition={{
        duration,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: duration * 0.75 }
      }}
      className={`overflow-hidden ${className || ""}`}
    >
      {isVisible && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: staggerDelay,
            duration: duration * 0.75,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

export function StaggeredRevealAnimation({
  children,
  isVisible,
  className,
  duration = 0.4,
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
  duration?: number;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={isVisible ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
      transition={{
        duration,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: duration * 0.75 }
      }}
      className={`overflow-hidden ${className || ""}`}
    >
      {isVisible && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: staggerDelay,
            duration: duration * 0.75,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

export function AnimatedIcon({
  children,
  delay = 0.2,
  duration = 0.3,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        delay,
        duration,
        ease: [0.34, 1.56, 0.64, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedText({
  children,
  delay = 0.25,
  duration = 0.3,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        delay,
        duration,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export {
  motion,
  AnimatePresence,
  useInView,
  type UseInViewOptions,
  type Variants,
};
