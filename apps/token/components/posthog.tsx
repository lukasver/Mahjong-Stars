// app/providers.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { publicUrl } from "@/common/config/env";

const IS_TEST =
  process.env.NODE_ENV === "test" ||
  process.env.E2E_TEST_MODE === "true" ||
  publicUrl?.includes("tests");

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (IS_TEST) {
      return;
    }
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: "/ingest",
      ui_host: "https://eu.i.posthog.com",
      person_profiles: "always", // or 'always' to create profiles for anonymous users as well
      defaults: "2025-11-30",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
