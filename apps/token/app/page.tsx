import { invariant } from "@epic-web/invariant";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Image from "next/image";
import { Suspense } from "react";
import { ConnectWallet } from "@/components/connect-wallet";
import { Logo, LogoAnimate } from "@/components/logo";
import { getBlockchains } from "@/lib/services/fetchers.server";
import { getQueryClient } from "@/lib/services/query";

export default async function Login() {
  return (
    <div className={"grid min-h-[100dvh] grid-rows-[auto_1fr_auto]"}>
      <div />
      <main className="grid place-items-center bg-cover bg-center relative">
        <div className="relative z-10 flex flex-col gap-8 items-center p-4 sm:p-6 md:p-10 rounded-md w-full max-w-sm sm:max-w-md">
          <div className="flex flex-col items-center gap-4">
            {/* Icon XL Logo with spring bounce animation */}
            <LogoAnimate animation="springBounce" delay={0}>
              <Logo
                variant="iconXl"
                imageProps={{
                  priority: true,
                }}
              />
            </LogoAnimate>

            {/* Main Logo with waterfall delay and slide up animation */}
            <LogoAnimate
              animation="slideUp"
              delay={0.3}
              className="w-full flex justify-center"
            >
              <Logo
                imageProps={{
                  width: 235,
                  height: 78,
                  className: "w-48 sm:w-56 md:w-64 h-auto",
                  priority: true,
                }}
              />
              <span className="sr-only">Mahjong Stars</span>
            </LogoAnimate>
          </div>

          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            {/* Login Form with final waterfall delay */}
            <LogoAnimate
              animation="fadeIn"
              delay={0.6}
              className="bg-transparent w-full flex justify-center"
            >
              <LoginComponent />
            </LogoAnimate>
          </Suspense>
        </div>
        <Image
          src="/static/images/bg.webp"
          alt="bg"
          width={1440}
          height={1024}
          className="w-full h-full object-cover fixed z-[-1] inset-0"
        />
      </main>
      <div />
    </div>
  );
}

const LoginComponent = async () => {
  const qc = getQueryClient();

  const { data } = await qc.fetchQuery({
    queryKey: ["blockchains"],
    queryFn: () => getBlockchains(),
  });

  invariant(data?.chains, "Chains not configured");


  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <div className="w-full max-w-[300px] [&>button]:w-full!">
        <ConnectWallet chains={data.chains} />
      </div>
    </HydrationBoundary>
  );
};
