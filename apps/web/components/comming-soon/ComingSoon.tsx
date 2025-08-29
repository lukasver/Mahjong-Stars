import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { cn } from "@mjs/ui/lib/utils";
import { headers } from "next/headers";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { userAgent } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getMNumber } from "@/lib/mnumber";
import mobilePoster from "@/public/static/images/mobileposter.webp";
import poster from "@/public/static/images/poster.webp";
import poster2 from "@/public/static/images/poster2.webp";
import mobilePoster2 from "@/public/static/images/poster2-mobile.webp";
import poster3 from "@/public/static/images/poster3.webp";
import mobilePoster3 from "@/public/static/images/poster3-mobile.webp";
import { VideoPlayerProvider } from "../use-video-player";
import { WebMSupportDetector } from "../web-support-detector";
import HeroContent from "./HeroContent";
import SpeechBubble from "./speech-bubble";
import SpeechBubbleContainer from "./speech-bubble-container";
import VideoPlayer from "./video-player";

const MOBILE_OPTIMIZED = process.env.MOBILE_OPTIMIZED === "true";

const BackgroundImage = ({ poster }: { poster: StaticImageData }) => {
  return (
    <Image
      {...poster}
      alt="poster"
      height={1080}
      width={1920}
      className="absolute inset-0 w-full object-contain h-full bg-cover sm:bg-center bg-no-repeat max-w-screen"
    />
  );
};

export default async function CommingSoon() {
  const mNumber = getMNumber();

  const t = await getTranslations();
  const len = Array.from({ length: 20 });
  const lines = len
    .map((_, i) => t(`Bubbles.lines.${mNumber}.${i + 1}`))
    .filter((v, i) => v && v !== `Bubbles.lines.${mNumber}.${i + 1}`);
  const title = t.markup(`Bubbles.title.${mNumber}`, {
    // @ts-expect-error wontfix
    br: (chunks) => (
      <>
        <br />
        {chunks}
      </>
    ),
  });

  const mMapping = {
    1: poster,
    2: poster2,
    3: poster3,
  };

  return (
    <VideoPlayerProvider>
      <WebMSupportDetector
        webmBackgroundColor={cn(
          "bg-[#770205]",
          (mNumber == 2 || mNumber == 3) && "bg-[#970706]",
        )}
        fallbackBackgroundColor={cn(
          "bg-[#830409]",
          (mNumber == 2 || mNumber == 3) && "bg-[#970706]",
        )}
      >
        <div className="relative w-screen h-screen sm:h-[468px] lg:h-auto overflow-hidden xl:h-[calc(100dvh-10px)]">
          <ErrorBoundary
            fallback={<BackgroundImage poster={mMapping[mNumber]} />}
          >
            <Suspense fallback={<BackgroundImage poster={mMapping[mNumber]} />}>
              <DynamicVideo />
            </Suspense>
          </ErrorBoundary>

          {/* Static Image Background - Mobile */}
          {MOBILE_OPTIMIZED && <BackgroundImage poster={mMapping[mNumber]} />}
          {/* Overlay */}
          <div className="absolute inset-0 bg-red-900/20" />

          <main
            id="newsletter"
            className="h-full grid place-content-center lg:block"
          >
            <HeroContent
              title={title}
              description={t.markup("Bubbles.description", {
                // @ts-expect-error wontfix
                br: (chunks) => (
                  <>
                    <br />
                    {chunks}
                  </>
                ),
              })}
              agreeTerms={t.rich("Bubbles.agreeTerms", {
                terms: (chunks) => (
                  <Link href="/terms" className="underline hover:text-white">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className="underline hover:text-white">
                    {chunks}
                  </Link>
                ),
              })}
              lines={lines}
            >
              <div className="absolute top-55 left-10 md:top-10 md:left-auto md:right-10 lg:top-[10%] lg:right-[10%]">
                <SpeechBubbleContainer messages={lines}>
                  <SpeechBubble />
                </SpeechBubbleContainer>
              </div>
            </HeroContent>
          </main>
        </div>
      </WebMSupportDetector>
    </VideoPlayerProvider>
  );
}

const DynamicVideo = async () => {
  const mNumber = getMNumber();

  const headersList = await headers();
  const agent = userAgent({ headers: headersList });

  const mMapping = {
    1: agent?.device?.type === "mobile" ? mobilePoster.src : poster.src,
    2: agent?.device?.type === "mobile" ? mobilePoster2.src : poster2.src,
    3: agent?.device?.type === "mobile" ? mobilePoster3.src : poster3.src,
  };

  return (
    <VideoPlayer
      mNumber={mNumber}
      src={[
        {
          src: `/static/videos/comingsoon-${mNumber}.webm`,
          type: "video/webm",
        },
        {
          src: `/static/videos/comingsoon-${mNumber}.mp4`,
          type: "video/mp4",
        },
      ]}
      mobileSrc={
        MOBILE_OPTIMIZED
          ? null
          : [
            {
              src: `/static/videos/comingsoon-mobile-${mNumber}.webm`,
              type: "video/webm",
            },
            {
              src: `/static/videos/comingsoon-mobile-${mNumber}.mp4`,
              type: "video/mp4",
            },
          ]
      }
      poster={mMapping[mNumber]}
    />
  );
};
