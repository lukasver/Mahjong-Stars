'use client';

import { cn } from '@mjs/ui/lib/utils';
import { useEffect, useRef } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { AnimatePresence, motion } from '@mjs/ui/components/motion';
import { useVideoPlayer } from '../use-video-player';

function VideoPlayer({
  src,
  mobileSrc,
  className,
  poster,
  mNumber,
}: {
  src: { src: string; type: string } | { src: string; type: string }[];
  mobileSrc:
    | { src: string; type: string }
    | { src: string; type: string }[]
    | null;
  className?: string;
  poster?: string;
  mNumber: number;
}) {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPlaying, setIsPlaying } = useVideoPlayer();

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error('Video play failed:', err);
      });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Initial state check
    setIsPlaying(!video.paused && !video.ended);

    // Cleanup
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isMobile, mobileSrc, src]);

  if (isMobile) {
    console.debug('🚀 ~ video-player.tsx:73 ~ mobileSrc:', mobileSrc);

    if (!mobileSrc) {
      return null;
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.4,
            scale: { type: 'tween', visualDuration: 0.4, bounce: 0.5 },
          }}
          className='contents'
        >
          <video
            id='video'
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className={cn(
              'absolute w-full object-contain bottom-[25%] md:bottom-auto md:inset-0',
              'hide-play-button',
              mNumber === 1 && 'h-full',
              mNumber !== 1 && 'h-full',
              className
            )}
            {...(poster ? { poster } : {})}
          >
            {Array.isArray(mobileSrc) ? (
              mobileSrc.map((props) => <source key={props.src} {...props} />)
            ) : (
              <source {...mobileSrc} />
            )}
            Your browser does not support the video tag.
          </video>
          <div
            onClick={!isPlaying ? handlePlayVideo : undefined}
            className={cn(
              'absolute inset-0 z-1 h-[75%] sm:hidden',
              isMobile &&
                mobileSrc &&
                'bg-gradient-to-t from-[#920B0A] from-8% via-[#920B0A] via-5% to-transparent to-10%',
              !isPlaying && 'z-50'
            )}
          />
          {/* Optionally, show a custom play button if !isPlaying */}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.4,
          scale: { type: 'tween', visualDuration: 0.4, bounce: 0.5 },
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{ height: 'inherit' }}
          className={cn(
            'absolute inset-0 w-full xl:object-contain hidden md:block 3xl:min-h-screen',
            className
          )}
          {...(poster ? { poster } : {})}
        >
          {Array.isArray(src) ? (
            src.map((props) => <source key={props.src} {...props} />)
          ) : (
            <source {...src} />
          )}
          Your browser does not support the video tag.
        </video>
      </motion.div>
    </AnimatePresence>
  );
}

export default VideoPlayer;
