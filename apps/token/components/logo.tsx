import MahjongStarsIcon from '@/public/static/favicons/favicon-48x48.png';
import MahjongStarsLogo from '@/public/static/images/logo-wt.webp';
import MahjongStarsIconXl from '@/public/static/favicons/android-chrome-512x512.png';

import { cn } from '@mjs/ui/lib/utils';
import Image from 'next/image';

const variantMapping = {
  logo: MahjongStarsLogo,
  icon: MahjongStarsIcon,
  iconXl: MahjongStarsIconXl,
};

export const Logo = ({
  variant = 'logo',
  className,
}: {
  variant?: 'logo' | 'icon' | 'iconXl';
  className?: string;
}) => {
  const { blurHeight, blurWidth, ...rest } =
    variantMapping[variant as keyof typeof variantMapping];
  return (
    <figure className={cn(className, 'dark:bg-none')}>
      <Image
        alt='Mahjong Stars Logo'
        {...rest}
        height={80}
        width={100}
        priority
        // className='w-auto h-6 sm:h-8 md:h-10'
      />
    </figure>
  );
};
