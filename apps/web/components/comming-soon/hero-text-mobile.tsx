'use client';

import { cn } from '@mjs/ui/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useVideoPlayer } from '../use-video-player';
import SpeechBubble from './speech-bubble';
import { useSpeechBubbleMessage } from './speech-bubble-container';

export function HeroTextMobile({ title }: { title: string }) {
  const { message } = useSpeechBubbleMessage();
  const [hasH1Exited, setHasH1Exited] = useState(false);
  const [bubbleExited, setBubbleExited] = useState(true);
  const { isPlaying } = useVideoPlayer();

  // When a message appears, reset bubbleExited so the bubble waits for h1 to exit
  useEffect(() => {
    if (message) setBubbleExited(false);
  }, [message]);

  // When message disappears, reset h1 state so it can reappear
  useEffect(() => {
    if (!message) setHasH1Exited(false);
  }, [message]);

  // Show h1 if there is no message and the bubble has exited (or on initial render)
  const showH1 = !isPlaying || (!message && bubbleExited === true);
  // Show bubble if h1 has exited and there is a message
  const showBubble = isPlaying && hasH1Exited && !!message;

  return (
    <div className='relative w-full'>
      <AnimatePresence onExitComplete={() => setHasH1Exited(true)}>
        {showH1 && (
          <motion.div
            key='hero-text-mobile'
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h1
              className={cn(
                'text-4xl/[90%] sm:text-5xl/[90%] font-semibold text-white text-left lg:text-center'
              )}
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className='absolute top-24 left-0 right-0'>
        <SpeechBubble show={showBubble} onExitComplete={setBubbleExited} />
      </div>
    </div>
  );
}
