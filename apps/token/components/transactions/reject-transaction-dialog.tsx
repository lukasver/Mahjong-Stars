'use client';

import { useState } from 'react';
import { Textarea } from '@mjs/ui/primitives/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';
import { XCircle } from 'lucide-react';
import { rejectAdminTransaction } from '@/lib/actions/admin';
import { toast } from '@mjs/ui/primitives/sonner';
import { AdminTransactionsWithRelations } from '@/common/types/transactions';
import { Label } from '@mjs/ui/primitives/label';
import { getQueryClient } from '@/app/providers';

interface RejectTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: AdminTransactionsWithRelations;
}

/**
 * Dialog component for rejecting a transaction
 * Allows admin to add an optional comment for rejection
 */
export function RejectTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: RejectTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState('');

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectAdminTransaction({
        id: transaction.id,
        comment: comment.trim() || undefined,
      });
      toast.success('Transaction rejected successfully');
      const queryClient = getQueryClient();
      await queryClient.invalidateQueries({
        queryKey: ['transactions'],
      });
      onOpenChange(false);
      setComment('');
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('Failed to reject transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setComment('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-lg'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <XCircle className='h-5 w-5 text-red-600' />
            Reject Transaction
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject this transaction? If payment has
            been done by the user a refund might need to be performed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-4'>
          {/* Transaction Info */}
          <div className='bg-muted/50 rounded-lg p-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='font-medium text-muted-foreground'>ID:</span>
              <span className='font-mono'>{transaction.id}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='font-medium text-muted-foreground'>User:</span>
              <span>
                {transaction.user.profile?.firstName}{' '}
                {transaction.user.profile?.lastName}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='font-medium text-muted-foreground'>Email:</span>
              <a
                href={`mailto:${transaction.user.email}`}
                className='text-primary hover:underline'
              >
                {transaction.user.email}
              </a>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='font-medium text-muted-foreground'>Amount:</span>
              <span>
                {transaction.quantity.toString()} {transaction.tokenSymbol}
              </span>
            </div>
          </div>

          {/* Comment Input */}
          <div className='space-y-2'>
            <Label htmlFor='rejection-comment'>
              Rejection Comment (Optional)
            </Label>
            <Textarea
              id='rejection-comment'
              placeholder='Enter a reason for rejection...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className='min-h-[100px]'
            />
            <p className='text-xs text-muted-foreground'>
              This comment will be visible to the user and stored with the
              transaction.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={isLoading}
            className='bg-red-600 hover:bg-red-700'
          >
            {isLoading ? 'Rejecting...' : 'Reject Transaction'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
