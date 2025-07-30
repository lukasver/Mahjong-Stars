'use client';
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';
import { toast } from '@mjs/ui/primitives/sonner';
import { DocumentRecipient } from '@prisma/client';
import { useEffect } from 'react';

export function ContractDialogFailed({
  onClose,
  recipient,
}: {
  onClose: () => void;
  recipient?:
    | Pick<
        DocumentRecipient,
        'id' | 'status' | 'signatureUrl' | 'email' | 'fullname'
      >
    | undefined;
}) {
  useEffect(() => {
    // On mount remove the cid from the query parameter to allow user to start flow again
    onClose?.();
    if (recipient?.status === 'ERROR') {
      toast.error(
        'Contract generation failed, please try again or contact support',
        {
          description: `RecipientID: ${recipient.id}`,
        }
      );
    }
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
