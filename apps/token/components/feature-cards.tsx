'use client';

import { motion } from '@mjs/ui/components/motion';
import Image from 'next/image';
import { cn } from '@mjs/ui/lib/utils';

interface FeatureCard {
  id: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

const featureCards: FeatureCard[] = [
  {
    id: 1,
    title: 'Stay in the Game Stay on Top',
    description: 'Play anytime. Climb the leaderboard and prove your skill.',
    imageSrc: '/static/images/features1.webp',
    imageAlt: 'Character with trophy',
  },
  {
    id: 2,
    title: 'Trainable AI That Plays Your Way',
    description:
      'Customize an AI to learn and adapt to your strategies. Coming later 2025.',
    imageSrc: '/static/images/features2.webp',
    imageAlt: 'Character with AI device',
  },
  {
    id: 3,
    title: 'Collect the Unforgettable',
    description:
      'Unlock rare characters and exclusive items with your StarPoints.',
    imageSrc: '/static/images/features3.webp',
    imageAlt: 'Character with treasure chest',
  },
  {
    id: 4,
    title: 'Bring Your Friends to the Table',
    description:
      'Challenge friends, share laughs, and battle through epic matches.',
    imageSrc: '/static/images/features4.webp',
    imageAlt: 'Two characters with mahjong tiles',
  },
];

/**
 * FeatureCards component that renders 4 square cards with sequential animations
 */
export function FeatureCards() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6'>
      {featureCards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: index * 0.2,
            duration: 0.6,
            scale: { type: 'spring', visualDuration: 0.6, bounce: 0.3 },
          }}
          className={cn(
            'relative overflow-hidden rounded-lg border border-zinc-200/20 bg-zinc-900/50 backdrop-blur-sm',
            'aspect-square p-3 sm:p-4 flex flex-col justify-between',
            'hover:border-zinc-200/40 transition-colors duration-300'
          )}
        >
          <div className='flex-1 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4'>
            <div className='relative w-32 h-32 sm:w-32 sm:h-32 md:w-24 md:h-24 xl:w-28 xl:h-28'>
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                fill
                className='object-contain'
                sizes='(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 128px'
              />
            </div>

            <div className='space-y-1 sm:space-y-2'>
              <h3 className='text-xs sm:text-sm md:text-base font-bold text-white leading-tight'>
                {card.title}
              </h3>
              <p className='text-xs text-zinc-300 leading-relaxed'>
                {card.description}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
