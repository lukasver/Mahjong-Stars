"use client";

import { AnimatePresence, motion } from "@mjs/ui/components/motion";
import { useCookieConsent } from "@mjs/ui/hooks/use-cookie-consent";
import { Button } from "@mjs/ui/primitives/button";
import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";

export function CookieConsentBanner({
  onAcceptAll,
  onRejectAll,
  privacyPolicyUrl,
}: {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  privacyPolicyUrl?: string;
}) {
  const { hasConsent, isLoaded, saveConsent } =
    useCookieConsent();
  const [showBanner, setShowBanner] = useState(false);

  // Show banner only if consent hasn't been given and page is loaded
  useEffect(() => {
    if (isLoaded && !hasConsent) {
      setShowBanner(true);
    }
  }, [isLoaded, hasConsent]);

  const handleAcceptAll = () => {
    saveConsent({ analytics: true });
    setShowBanner(false);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    saveConsent({ analytics: false });
    onRejectAll?.();
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
            opacity: { duration: 0.2 },
          }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Content */}
            <div className="flex gap-4 flex-1">
              <Cookie className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  We use cookies to enhance your experience
                </h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to understand how you use our site so we can
                  improve your experience. Your data helps us make better decisions.{" "}
                  {privacyPolicyUrl && <a
                    href={privacyPolicyUrl}
                    className="underline hover:text-foreground transition-colors"
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </a>}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="whitespace-nowrap bg-transparent"
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="whitespace-nowrap"
              >
                Accept
              </Button>
            </div>

            {/* Close button */}
            <button
              onClick={handleRejectAll}
              className="absolute top-4 right-4 md:hidden text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close cookie consent banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
