import Image from 'next/image';
import type { FC } from 'react';
import Banner from '@/public/static/images/banner.png';
import { cn } from '@mjs/ui/lib/utils';

/**
 * SaleCoverImageProps component displays a responsive cover image using Next.js Image optimization.
 * @param {object} props - Component props
 * @param {string} props.src - The source URL of the cover image
 * @param {string} [props.alt] - The alt text for the image
 * @param {number} [props.width=1200] - The width of the image (default: 1200)
 * @param {number} [props.height=400] - The height of the image (default: 400)
 * @returns The cover image component
 */
type SaleCoverImageProps = {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

export const SaleCoverImage: FC<SaleCoverImageProps> = ({
  src,
  alt = 'Cover image',
  width = 1200,
  height = 400,
  className,
}) => {
  return (
    <Image
      alt={alt}
      width={width}
      height={height}
      style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
      className={cn('w-full h-full object-cover', className)}
      priority
      {...(src ? { src } : { ...Banner })}
    />
  );
};
