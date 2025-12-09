"use client";

import { ThemeSwitcher } from "@mjs/ui/components/theme-switcher";
import { Separator } from "@mjs/ui/primitives/separator";
import { SidebarTrigger } from "@mjs/ui/primitives/sidebar";
import {
  ConnectWalletWithChains
} from "@/components/connect-wallet";

//TODO: implement
const ENABLE_THEME_SWITCHER = false;

export function DashboardHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-3 sm:px-4 backdrop-blur-sm md:px-6 w-full">
      <SidebarTrigger />
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4"></div>
      <div className="flex items-center gap-1 sm:gap-2">
        {ENABLE_THEME_SWITCHER && <ThemeSwitcher />}
        <Separator orientation="vertical" className="h-6 sm:h-8" />
        {children ? (
          <>
            {children}
            <Separator orientation="vertical" className="h-6 sm:h-8" />
          </>
        ) : null}
        <ConnectWalletWithChains />
      </div>
    </header>
  );
}
