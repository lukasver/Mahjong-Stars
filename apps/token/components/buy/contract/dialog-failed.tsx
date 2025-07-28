'use client';
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';
import { useEffect } from 'react';

export function ContractDialogFailed({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // On mount remove the cid from the query parameter to allow user to start flow again
    onClose?.();
  }, []);
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Contract Generation Failed</AlertDialogTitle>
      </AlertDialogHeader>
      <AlertDialogDescription className='text-secondary'>
        Please try again later.
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
