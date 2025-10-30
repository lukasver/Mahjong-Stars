"use client";

import { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PulseLoader } from "@/components/pulse-loader";
import { logout } from "@/lib/actions";

export function AuthRedirect() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const error = searchParams.get("error");
  const logoutParam = searchParams.get("logout");
  const router = useRouter();
  useEffect(() => {
    if (to) {
      router.replace(to as Route);
    }
    if (error || logoutParam) {
      (async () => {
        // Server action to delete session cookie
        await logout({ redirectTo: "/", redirect: true });

      })();
    }
  }, [to, router, error]);

  if (error) {
    return (
      <PulseLoader>
        <div className="flex flex-col gap-1 items-start">
          <span className="text-xl font-bold font-head">{logoutParam ? "Logging out..." : "Redirecting..."}</span>
          {<span className="text-base font-semibold font-common text-secondary">
            {error}
          </span>}
        </div>
      </PulseLoader>
    );
  }
  return (
    <PulseLoader text={error ? "Redirecting..." : "Getting stuff ready..."} />
  );
}
