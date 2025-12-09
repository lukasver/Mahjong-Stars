"use client"

import { CookieConsentBanner } from "@mjs/ui/primitives/cookie-consent";

export function CookieConsent() {
  const handleAcceptAll = () => {
    console.log("Accept all");
  };
  const handleRejectAll = () => {
    console.log("Reject all");
  };
  return <CookieConsentBanner
    privacyPolicyUrl={"/web/privacy"}
    onAcceptAll={handleAcceptAll}
    onRejectAll={handleRejectAll}
  />;
}
