'use client';
import {
  AnimatePresence,
  motion,
  useInView,
  type UseInViewOptions,
  type Variants,
} from '@mjs/ui/components/motion';
import { useRef, useState } from 'react';

import Image from 'next/image';
import { isAbsoluteUrl } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader } from '@mjs/ui/primitives/dialog';
import { Button } from '@mjs/ui/primitives/button';
import { X } from 'lucide-react';

interface ImageItem {
  src: string;
  id: string;
  alt?: string;
}

function ImagesSection({ images }: { images: ImageItem[] }) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <>
      <div className='columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4'>
        {images.map(({ id, src }, idx) => {
          if (!isAbsoluteUrl(src)) return null;
          return (
            <Button
              key={id}
              variant='ghost'
              className='after:content after:shadow-highlight group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg p-0 h-auto'
              onClick={() =>
                handleImageClick({ id, src, alt: `promo-image-${id}` })
              }
            >
              <BlurFade delay={0.25 + idx * 0.05} inView>
                <Image
                  alt={`promo-image-${id}`}
                  className='transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110'
                  style={{ transform: 'translate3d(0, 0, 0)' }}
                  src={src}
                  width={720}
                  height={480}
                  sizes='(max-width: 640px) 100vw,
              (max-width: 1280px) 50vw,
              (max-width: 1536px) 33vw,
              25vw'
                />
              </BlurFade>
            </Button>
          );
        })}
      </div>

      {/* Image Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] p-0'>
          <DialogHeader className='absolute top-4 right-4 z-10'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleCloseModal}
              className='h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70'
            >
              <X className='h-4 w-4' />
              <span className='sr-only'>Close</span>
            </Button>
          </DialogHeader>
          {selectedImage && (
            <div className='relative w-full h-full flex items-center justify-center'>
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt || `Enlarged image ${selectedImage.id}`}
                width={1200}
                height={800}
                className='max-w-full max-h-full object-contain'
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
type MarginType = UseInViewOptions['margin'];
interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
  key?: string | number;
  once?: boolean;
}

function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
  key,
  once = true,
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        ref={ref}
        key={key}
        initial='hidden'
        animate={isInView ? 'visible' : 'hidden'}
        exit='hidden'
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: 'easeOut',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default ImagesSection;
