import Image from 'next/image';

import MahjongStarsIconXl from '@/public/static/favicons/android-chrome-512x512.png';

export function PulseLoader({ children }: { children?: React.ReactNode }) {
  return (
    <div className='flex items-center gap-2'>
      <span className='aspect-square animate-pulse'>
        <Image
          height={80}
          width={80}
          src={MahjongStarsIconXl}
          alt='Mahjong Stars Logo'
          className='animate-spin aspect-square'
        />
      </span>
      {children || (
        <span className='text-xl font-bold font-head'>Loading...</span>
      )}
    </div>
  );
}
