'use client';

import { useState } from 'react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { FileUpload } from '@mjs/ui/components/file-upload';
import { Button } from '@mjs/ui/primitives/button';
import { motion } from '@mjs/ui/components/motion';
import {
  associateDocumentsToUser,
  getFileUploadPrivatePresignedUrl,
} from '@/lib/actions';
import { uploadFile } from '@/lib/utils/files';
import { useUser } from '@/lib/services/api';
import { invariant } from '@epic-web/invariant';
import { isFileWithPreview } from './utils';

interface KycUploadStepProps {
  onSuccess: () => void;
}

/**
 * KYC Document Upload Step
 * Allows user to upload up to 3 files for KYC verification.
 * Uses FileUpload component for file selection and removal.
 * On submit, uploads files using presigned URLs.
 */
export function KycUploadStep({ onSuccess }: KycUploadStepProps) {
  const { data: user } = useUser();
  const [files, setFiles] = useState<unknown[]>([]); // Array of FileWithPreview
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles file selection for the input (multiple files)
   * @param fileList - Array of FileWithPreview
   */
  const handleFilesChange = (fileList: unknown[]) => {
    setFiles(fileList.slice(0, 3));
    setError(null);
    setSuccess(false);
  };

  /**
   * Handles the upload of all selected files.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      invariant(user, 'User id could not be found');
      const validFiles = files
        .map((f) => (isFileWithPreview(f) ? f.file : null))
        .filter((f): f is File => !!f);
      const response = await Promise.all(
        validFiles.map(async (file) => {
          const key = `user/${user.id}/kyc/${file.name}`;
          const urlRes = await getFileUploadPrivatePresignedUrl({ key });
          if (!urlRes?.data?.url) throw new Error('Failed to get upload URL');
          await uploadFile(file, urlRes.data.url).then();
          // Here i need to update our backend with refernece to the file
          return key;
        })
      );

      const keys = response.flatMap((key) => ({ key }));
      await associateDocumentsToUser({
        documents: keys,
      });

      setSuccess(true);
      setFiles([]);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContent>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <CardHeader>
          <CardTitle>KYC Document Upload</CardTitle>
          <CardDescription>
            Please upload your documents for your KYC verification (id /
            passport / proof of tax residence).
          </CardDescription>
        </CardHeader>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <FileUpload
          type='all'
          maxSizeMB={5}
          className='w-full'
          multiple
          onFilesChange={handleFilesChange}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className='space-y-2'
      >
        {error && <div className='text-destructive mt-2'>{error}</div>}
        {success && (
          <div className='text-success mt-2'>Files uploaded successfully!</div>
        )}
        <Button
          className='mt-4 w-full'
          onClick={handleSubmit}
          variant='accent'
          disabled={isSubmitting || files.length === 0}
        >
          {isSubmitting ? 'Uploading...' : 'Submit KYC Documents'}
        </Button>
      </motion.div>
    </CardContent>
  );
}
