'use client';

import {
  AlertCircleIcon,
  ImageIcon,
  PaperclipIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';

import {
  FileUploadOptions,
  useFileUpload,
} from '@mjs/ui/hooks/use-file-upload';
import { Button } from '@mjs/ui/primitives/button';
import { cn } from '../lib/utils';

const isImage = (fileName: string | null) => {
  if (!fileName) return false;
  return (
    fileName.endsWith('.png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.gif') ||
    fileName.endsWith('.webp')
  );
};

type FileUploadProps = Partial<FileUploadOptions> & {
  className?: string;
  type?: 'image' | 'document' | 'all';
};

const imageTypes =
  'image/svg+xml,image/png,image/jpeg,image/jpg,image/gif,image/webp';
const documentTypes =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

const typeMapping = {
  image: imageTypes,
  document: documentTypes,
  all: imageTypes + ',' + documentTypes,
};

export function FileUpload({ type = 'all', ...props }: FileUploadProps) {
  const maxSizeMB = 2;
  const maxSize = maxSizeMB * 1024 * 1024; // 2MB default

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: typeMapping[type],
    maxSize,
    ...props,
  });
  const previewUrl = files[0]?.preview || null;
  const fileName = files[0]?.file.name || null;

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <div className='relative'>
        {/* Drop area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className='border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]'
        >
          <input
            {...getInputProps()}
            className='sr-only'
            aria-label='Upload file'
          />
          {previewUrl ? (
            type === 'image' || isImage(fileName) ? (
              <ImagePreview url={previewUrl} type={type} fileName={fileName} />
            ) : (
              <DocumentPreview fileName={fileName} size={files[0]?.file.size} />
            )
          ) : (
            <div className='flex flex-col items-center justify-center px-4 py-3 text-center'>
              <FileUploadHeader type={type} maxSizeMB={maxSizeMB} />
              <Button
                variant='outline'
                className='mt-4'
                onClick={openFileDialog}
              >
                <UploadIcon
                  className='-ms-1 size-4 opacity-60'
                  aria-hidden='true'
                />
                Select {type === 'image' ? 'image' : 'file'}
              </Button>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className='absolute top-4 right-4'>
            <button
              type='button'
              className='focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
              // @ts-expect-error fixme
              onClick={() => removeFile(files[0]?.id)}
              aria-label='Remove file'
            >
              <XIcon className='size-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className='text-destructive flex items-center gap-1 text-xs'
          role='alert'
        >
          <AlertCircleIcon className='size-3 shrink-0' />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}

const FileUploadHeader = ({
  type,
  maxSizeMB,
}: {
  type: NonNullable<FileUploadProps['type']>;
  maxSizeMB: number;
}) => {
  return (
    <div className='flex flex-col items-center justify-center text-center'>
      <div className='flex items-center justify-center gap-4'>
        {['all', 'image'].includes(type) && (
          <div
            className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
            aria-hidden='true'
          >
            <ImageIcon className='size-4 opacity-60' />
          </div>
        )}
        {['all', 'document'].includes(type) && (
          <div
            className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
            aria-hidden='true'
          >
            <UploadIcon className='size-4 opacity-60' />
          </div>
        )}
      </div>
      <p className='mb-1.5 text-sm font-medium'>
        {type === 'image' ? 'Drop your image here' : 'Upload file'}
      </p>
      <p className='text-muted-foreground text-xs'>
        {type === 'image'
          ? `SVG, PNG, JPG or GIF (max. ${maxSizeMB}MB)`
          : `Drag & drop or click to browse (max. ${maxSizeMB}MB)`}
      </p>
    </div>
  );
};

const DocumentPreview = ({
  fileName,
  size,
}: {
  fileName: string | null;
  size: number | undefined;
}) => {
  return (
    <div className='space-y-2 w-full'>
      <div className='flex items-center justify-between gap-2 rounded-xl border px-4 py-2 w-full'>
        <div className='flex items-center gap-3 overflow-hidden w-full'>
          <PaperclipIcon
            className='size-4 shrink-0 opacity-60'
            aria-hidden='true'
          />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-[13px] font-medium'>{fileName}</p>
          </div>
          <span className='shrink-0 text-muted-foreground text-sm'>
            ({((size || 0) / 1024).toFixed(1)} KB)
          </span>
        </div>
      </div>
    </div>
  );
};

const ImagePreview = ({
  url,
  type,
  fileName,
}: {
  url: string;
  type: string;
  fileName?: string | null;
}) => {
  return (
    <div className='absolute inset-0 flex items-center justify-center p-4'>
      <img
        src={url}
        alt={fileName || `Uploaded ${type === 'image' ? 'image' : 'file'}`}
        className='mx-auto max-h-full rounded object-contain'
      />
    </div>
  );
};
