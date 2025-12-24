"use client";

import { VercelToolbar as VercelToolbarComponent } from "@vercel/toolbar/next";
import { isAdmin } from "@/lib/utils";

export const VercelToolbar = ({ roles }: { roles: Record<string, string> }) => {
  return isAdmin(roles) ? <VercelToolbarComponent /> : null;
};
