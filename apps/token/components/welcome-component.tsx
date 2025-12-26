"use client";

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

  if (!isClient || !isVisible) {
    return null;
  }

  return (
    <Alert className="relative border-red-900/30 bg-gradient-to-br from-red-950/50 to-red-900/30 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg text-white">{title}</h3>
          </div>

          <AlertDescription className="space-y-4 text-secondary">
            <p className="text-base leading-relaxed">{description}</p>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-red-500/20 text-red-300">
                    {step.icon}
                  </div>
                  <p className="flex-1 pt-0.5 text-sm leading-relaxed text-foreground">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </AlertDescription>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 transition-colors hover:bg-red-900/30 hover:text-white"
          aria-label="Dismiss welcome message"
        >
          <XIcon className="size-5" />
        </Button>
      </div>
    </Alert>
  );
}
