"use client"

import { CookieConsentBanner } from "@mjs/ui/primitives/cookie-consent";

export function CookieConsent() {
  const handleAcceptAll = () => {
    //TODO: connect with posthog
    console.log("Accept all");
  };
  const handleRejectAll = () => {
    //TODO: connect with posthog
    console.log("Reject all");
  };
  return <CookieConsentBanner
    privacyPolicyUrl={"/web/privacy"}
    onAcceptAll={handleAcceptAll}
    onRejectAll={handleRejectAll}
  />;
}
