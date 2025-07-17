'use client'
import { createImageUpload } from 'novel/plugins'
import { toast } from 'sonner'

export const uploadFn = (onUpload: (file: File) => Promise<unknown>) =>
  createImageUpload({
    onUpload,
    validateFn: (file) => {
      if (!file.type.includes('image/')) {
        toast.error('File type not supported.')
        return false
      } else if (file.size / 1024 / 1024 > 15) {
        toast.error('File size too big (max 15MB).')
        return false
      }
      return true
    },
  })
