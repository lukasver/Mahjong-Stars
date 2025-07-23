'use client';
import { getMNumber } from '@/lib/mnumber';
import { createContext, useContext, useEffect, useState } from 'react';

const debug = false;
const INITIAL_TIMER = debug ? 1000 : 3000;
const INTERVAL_TIMER = debug
  ? 3000
  : Number(process.env.NEXT_PUBLIC_BUBBLE_TIMER) || 10000;

function SpeechBubbleContainer({
  children,
  messages = [],
}: {
  children: React.ReactNode;
  messages: string[];
}) {
  const [showBubble, setShowBubble] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const showSpeechBubble = () => {
      // Select random message
      const randomIndex = Math.floor(Math.random() * messages.length);
      // Always provide a string (fixes linter error)
      const message = messages[randomIndex];
      setCurrentMessage(typeof message === 'string' ? message : '');
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
      }, 5000);
    };
    const initialTimer = setTimeout(showSpeechBubble, INITIAL_TIMER);
    const interval = setInterval(showSpeechBubble, INTERVAL_TIMER);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <SpeechBubbleContext
      value={{
        message: showBubble ? currentMessage : '',
        setMessage: setCurrentMessage,
        mNumber: getMNumber(),
      }}
    >
      {children}
    </SpeechBubbleContext>
  );
}

const SpeechBubbleContext = createContext<{
  message: string;
  setMessage: (message: string) => void;
  mNumber: 1 | 2 | 3;
  // biome-ignore lint/suspicious/noEmptyBlockStatements: empty fn for context
}>({ message: '', setMessage: () => {}, mNumber: 1 });

export const useSpeechBubbleMessage = () => {
  const { message, mNumber } = useContext(SpeechBubbleContext);
  return { message, mNumber };
};

export default SpeechBubbleContainer;
