'use client';

import {
  AnimatePresence,
  motion,
  useInView,
  type UseInViewOptions,
  type Variants,
} from 'motion/react';

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
        scale: { type: 'spring', visualDuration: duration, bounce: 0.5 },
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
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay: delay * 0.5,
        duration: duration,
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
        ease: 'easeInOut',
        times: [0, 0.5, 1],
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
