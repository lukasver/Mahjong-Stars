import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@mjs/ui/primitives/cropper';
import { cn } from '../lib/utils';

export function ImageCropper({
  src,
  aspectRatio,
  className,
}: {
  src: string;
  aspectRatio: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Cropper className='h-80' image={src} aspectRatio={aspectRatio}>
        <CropperDescription />
        <CropperImage />
        <CropperCropArea />
      </Cropper>
    </div>
  );
}
