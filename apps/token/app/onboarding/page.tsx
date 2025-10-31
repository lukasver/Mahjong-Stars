// import { getSession } from '../../lib/auth/better-auth/auth';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { COOKIE_PREFIX, MW_KEY } from "@/common/config/constants";
import BackgroundWrapper from "@/components/bg-wrapper";
import { PulseLoader } from "@/components/pulse-loader";
import { PointerEventsGuard } from "@/components/thirdweb/pointer-events-guard";
import {
  checkUserAndVerifyEmail,
  getCurrentUser,
} from "@/lib/services/fetchers.server";
import { VerifyEmail } from "../../components/verify-email";

export default async function Onboarding({ searchParams }: PageProps<'/onboarding'>) {
  const [res, params, c] = await Promise.all([
    getCurrentUser().catch(() => null),
    searchParams,
    cookies(),
  ]);

  // Here we should check if:
  // User is logged in from a social

  if (!res?.data) {
    redirect("/?error=unauthorized");
  }

  const user = res.data;
  let defaultEmail: string | undefined;


  if (!user.emailVerified && user.walletAddress) {
    // Check email and verify
    const result = await checkUserAndVerifyEmail(user.walletAddress);

    if (result) {
      defaultEmail = result;
    }
  }

  const magicWord = c.get(`${COOKIE_PREFIX}_${MW_KEY}`);

  if (user.emailVerified && magicWord) {
    redirect("/dashboard");
  }

  let initialStep: 1 | 2 | 3 | undefined;
  if (user.emailVerified && !magicWord) {
    initialStep = 1;
  }

  return (
    <Container>
      <Suspense fallback={<PulseLoader text="Wait for it..." />}>
        <VerifyEmail
          token={params.token ? String(params.token) : ""}
          initialStep={initialStep}
          email={
            !defaultEmail || defaultEmail?.startsWith("temp_")
              ? undefined
              : defaultEmail
          }
        />
      </Suspense>
    </Container>
  );
}

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <PointerEventsGuard>
      <BackgroundWrapper className={"size-full"}>
        <div className="grid min-h-[100dvh] grid-rows-[auto_1fr_auto]">
          <header className="invisible">a</header>
          <main className="container mx-auto grid place-items-center bg-cover bg-center relative z-20">
            {children}
          </main>
          <footer className="invisible">a</footer>
        </div>
      </BackgroundWrapper>
    </PointerEventsGuard>
  );
};

export const dynamic = "force-dynamic";
