import mobilePoster from '@/public/static/images/mobileposter.webp';
import poster from '@/public/static/images/poster.webp';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { userAgent } from 'next/server';
import { Suspense } from 'react';
import { VideoPlayerProvider } from '../use-video-player';
import { WebMSupportDetector } from '../web-support-detector';
import HeroContent from './HeroContent';
import SpeechBubble from './speech-bubble';
import SpeechBubbleContainer from './speech-bubble-container';
import VideoPlayer from './video-player';
import { cn } from '@mjs/ui/lib/utils';
import { getMNumber } from '@/lib/mnumber';

const MOBILE_OPTIMIZED = process.env.MOBILE_OPTIMIZED === 'true';

const BackgroundImage = ({ poster }: { poster: StaticImageData }) => {
  return (
    <Image
      {...poster}
      alt='poster'
      height={1080}
      width={1920}
      className='absolute inset-0 w-full object-contain h-full bg-cover sm:bg-center bg-no-repeat max-w-screen'
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

  return (
    <VideoPlayerProvider>
      <WebMSupportDetector
        webmBackgroundColor={cn(
          'bg-[#770205]',
          (mNumber == 2 || mNumber == 3) && 'bg-[#970706]'
        )}
        fallbackBackgroundColor={cn(
          'bg-[#830409]',
          (mNumber == 2 || mNumber == 3) && 'bg-[#970706]'
        )}
      >
        <div className='relative w-screen h-screen sm:h-[468px] lg:h-auto overflow-hidden xl:h-[calc(100dvh-10px)]'>
          <ErrorBoundary fallback={<BackgroundImage poster={poster} />}>
            <Suspense fallback={<BackgroundImage poster={poster} />}>
              <DynamicVideo />
            </Suspense>
          </ErrorBoundary>

          {/* Static Image Background - Mobile */}
          {MOBILE_OPTIMIZED && <BackgroundImage poster={poster} />}
          {/* Overlay */}
          <div className='absolute inset-0 bg-red-900/20' />

          <main
            id='newsletter'
            className='h-full grid place-content-center lg:block'
          >
            <HeroContent
              title={title}
              description={t.markup('Bubbles.description', {
                // @ts-expect-error wontfix
                br: (chunks) => (
                  <>
                    <br />
                    {chunks}
                  </>
                ),
              })}
              agreeTerms={t.rich('Bubbles.agreeTerms', {
                terms: (chunks) => (
                  <Link href='/terms' className='underline hover:text-white'>
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href='/privacy' className='underline hover:text-white'>
                    {chunks}
                  </Link>
                ),
              })}
              lines={lines}
            >
              <div className='absolute top-55 left-10 md:top-10 md:left-auto md:right-10 lg:top-[10%] lg:right-[10%]'>
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
  return (
    <VideoPlayer
      src={[
        {
          src: `/static/videos/comingsoon-${mNumber}.webm`,
          type: 'video/webm',
        },
        {
          src: `/static/videos/comingsoon-${mNumber}.mp4`,
          type: 'video/mp4',
        },
      ]}
      mobileSrc={
        MOBILE_OPTIMIZED
          ? null
          : [
              {
                src: `/static/videos/comingsoon-mobile-${mNumber}.webm`,
                type: 'video/webm',
              },
              {
                src: `/static/videos/comingsoon-mobile-${mNumber}.mp4`,
                type: 'video/mp4',
              },
            ]
      }
      poster={agent?.device?.type === 'mobile' ? mobilePoster.src : poster.src}
    />
  );
};
