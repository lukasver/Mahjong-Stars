"use client";

import {
  AnimatedIcon,
  AnimatedText,
  AnimatePresence,
  motion,
} from "@mjs/ui/components/motion";
import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import { Button } from "@mjs/ui/primitives/button";
import {
  InfoIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface WelcomeBannerProps {
  storageKey?: string;
  title?: string;
  description?: string;
  steps?: Array<{ icon: React.ReactNode; text: string }>;
}

export function WelcomeBanner({
  storageKey = "mjs-welcome-banner-dismissed",
  title = "Welcome to MahjongStairs Token Sale",
  description = "Get started with your token purchase journey:",
  steps = [
    {
      icon: <InfoIcon className="size-4 text-foreground" />,
      text: "Check the current ICO phase, token price, and remaining available tokens",
    },
    {
      icon: <ShoppingCartIcon className="size-4 text-foreground" />,
      text: "Click the 'Buy' to purchase tokens - your pending tokens will appear below",
    },
    {
      icon: <TrendingUpIcon className="size-4 text-foreground" />,
      text: "Monitor all your transactions in real-time and view upcoming ICO phases",
    },
    {
      icon: <WalletIcon className="size-4 text-foreground" />,
      text: "Your token balance updates automatically after each confirmed transaction",
    },
  ],
}: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, "true");
  };

  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          className="relative"
        >
          <Alert className="relative border-red-900/30 bg-gradient-to-br from-red-950/50 to-red-900/30 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <AnimatedText delay={0.1} duration={0.3}>
                    <h3 className="font-semibold text-lg text-white">
                      {title}
                    </h3>
                  </AnimatedText>
                </div>

                <AlertDescription className="space-y-4 text-secondary">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-base leading-relaxed"
                  >
                    {description}
                  </motion.p>

                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.3 + index * 0.1,
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        className="flex items-start gap-3"
                      >
                        <AnimatedIcon
                          delay={0.3 + index * 0.1}
                          duration={0.3}
                          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-red-500/20 text-red-300"
                        >
                          {step.icon}
                        </AnimatedIcon>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: 0.35 + index * 0.1,
                            duration: 0.3,
                          }}
                          className="flex-1 pt-0.5 text-sm leading-relaxed text-foreground"
                        >
                          {step.text}
                        </motion.p>
                      </motion.div>
                    ))}
                  </div>
                </AlertDescription>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 text-gray-400 transition-colors hover:bg-red-900/30 hover:text-white"
                  aria-label="Dismiss welcome message"
                >
                  <XIcon className="size-5" />
                </Button>
              </motion.div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
