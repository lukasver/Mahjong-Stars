'use client';

import { cn } from '@mjs/ui/lib/utils';
import { useEffect, useRef } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { useVideoPlayer } from '../use-video-player';

function VideoPlayer({
  src,
  mobileSrc,
  className,
  poster,
}: {
  src: { src: string; type: string } | { src: string; type: string }[];
  mobileSrc:
    | { src: string; type: string }
    | { src: string; type: string }[]
    | null;
  className?: string;
  poster?: string;
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
    if (!mobileSrc) {
      return null;
    }
    return (
      <>
        <video
          id='video'
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={cn(
            'absolute w-full h-fit! object-contain bottom-[25%] md:bottom-auto md:inset-0',
            'hide-play-button',
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
              'bg-gradient-to-t from-[#79080A] from-5% via-[#79080A] via-5% to-transparent to-10%',
            !isPlaying && 'z-50'
          )}
        />
        {/* Optionally, show a custom play button if !isPlaying */}
      </>
    );
  }

  return (
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
  );
}

export default VideoPlayer;
