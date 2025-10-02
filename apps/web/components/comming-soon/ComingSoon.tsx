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
      alt="Mahjong Stars game poster"
      height={1080}
      width={1920}
      className="absolute inset-0 w-full object-contain h-full bg-cover sm:bg-center bg-no-repeat max-w-screen"
      itemProp="image"
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
    <>
      <VideoPlayerProvider>
        <WebMSupportDetector
          webmBackgroundColor={cn(
            "bg-[#700609]",
            (mNumber == 2 || mNumber == 3) && "bg-[#8d0d0a]",
          )}
          fallbackBackgroundColor={cn(
            "bg-[#700609]",
            // (mNumber == 2 || mNumber == 3) && "bg-[#970706]",
          )}
        >
          <div
            itemScope
            itemType="https://schema.org/VideoGame"
            className="relative w-screen h-screen sm:h-[468px] lg:h-auto overflow-hidden xl:h-[calc(100dvh-10px)]"
          >
            <ErrorBoundary
              fallback={<BackgroundImage poster={mMapping[mNumber]} />}
            >
              <Suspense
                fallback={<BackgroundImage poster={mMapping[mNumber]} />}
              >
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
              itemProp="mainEntity"
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
                    <Link
                      href="/privacy"
                      className="underline hover:text-white"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
                lines={lines}
                t={t}
              >
                <div
                  className="absolute top-55 left-10 md:top-10 md:left-auto md:right-10 lg:top-[10%] lg:right-[10%]"
                  itemScope
                  itemType="https://schema.org/Person"
                  itemProp="character"
                >
                  <meta itemProp="name" content={mNumber === 1 ? "Anne Wan" : mNumber === 2 ? "Angry Dude" : "Mrs Chen"} />
                  <meta
                    itemProp="description"
                    content="AI Character in Mahjong Stars"
                  />
                  <SpeechBubbleContainer messages={lines}>
                    <SpeechBubble />
                  </SpeechBubbleContainer>
                </div>
              </HeroContent>
            </main>

            {/* Game Offers and Audience Microdata */}
            <div
              itemProp="offers"
              itemScope
              itemType="https://schema.org/Offer"
              className="hidden"
            >
              <meta itemProp="price" content="0" />
              <meta itemProp="priceCurrency" content="USD" />
              <meta
                itemProp="availability"
                content="https://schema.org/PreOrder"
              />
              <meta
                itemProp="description"
                content="Pre-order Mahjong Stars - Coming Soon"
              />
            </div>

            <div
              itemProp="audience"
              itemScope
              itemType="https://schema.org/PeopleAudience"
              className="hidden"
            >
              <meta itemProp="requiredMinAge" content="13" />
              <meta itemProp="suggestedMaxAge" content="99" />
              <meta itemProp="audienceType" content="Gamers" />
            </div>

            <div
              itemProp="gameItem"
              itemScope
              itemType="https://schema.org/Thing"
              className="hidden"
            >
              <meta itemProp="name" content="Mahjong Tiles" />
              <meta
                itemProp="description"
                content="Traditional Mahjong tiles used in gameplay"
              />
            </div>
          </div>
        </WebMSupportDetector>
      </VideoPlayerProvider>
    </>
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
