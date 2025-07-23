'use client';
import { cn } from '@mjs/ui/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Dispatch, SetStateAction } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { useSpeechBubbleMessage } from './speech-bubble-container';

/**
 * Renders an animated speech bubble with a message using Motion for React.
 * The bubble fades in and moves up when appearing, and fades out and moves down when disappearing.
 */
const SpeechBubble = ({
  className,
  show = true,
  onExitComplete,
}: {
  className?: string;
  show?: boolean;
  onExitComplete?: Dispatch<SetStateAction<boolean>>;
}) => {
  const { message, mNumber } = useSpeechBubbleMessage();

  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isVisible = Boolean(message) && show;

  return (
    <AnimatePresence onExitComplete={() => onExitComplete?.(true)}>
      {isVisible && (
        <motion.div
          key='speech-bubble'
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn(
            'shadow-[3px_4px_20.4px_0px_rgba(74,0,0,1)] rounded-2xl md:rounded-3xl',
            'z-30 w-full max-w-screen md:max-w-[400px] lg:max-w-[500px] xl:max-w-1xl',
            className
          )}
        >
          <div className='px-8 py-4 relative bg-white/10 backdrop-blur-md border-2 border-white/90 rounded-2xl md:rounded-3xl shadow-2xl w-full'>
            <p className='text-white text-xl xl:text-2xl font-normal'>
              {message}
            </p>
            <div className='text-white/30'>
              {/* Speech bubble tail */}

              <svg
                width='40'
                height='27'
                viewBox='0 0 40 27'
                stroke='white'
                strokeWidth='2'
                xmlns='http://www.w3.org/2000/svg'
                className={cn(
                  'absolute -bottom-5 left-5 w-10 h-5 z-10 fill-white/60',
                  isMobile && 'left-30!',
                  [2, 3].includes(mNumber) && 'left-40!'
                )}
              >
                <path
                  d='M0.0585938 1.79102C2.73274 1.79102 4.74716 4.22369 4.24855 6.85094L2.0948 18.1993C0.88627 24.5672 9.23425 28.0623 12.9231 22.7328L20.2605 12.132C24.7432 5.65567 32.1182 1.79102 39.9946 1.79102'
                  stroke='white'
                />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechBubble;
