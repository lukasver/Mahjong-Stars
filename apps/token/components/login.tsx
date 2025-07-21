'use client';

import { useState } from 'react';
import { Wallet } from 'thirdweb/wallets';
import { cn } from '@mjs/ui/lib/utils';
import { Icons } from '@mjs/ui/components/icons';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';
import { ConnectWallet } from './connect-wallet';

export function LoginForm({ className }: { className?: string }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = (_wallet: Wallet) => {
    setIsConnecting(true);
  };

  return (
    <>
      <div className={cn('w-full [&>button]:w-full!', className)}>
        <ConnectWallet onConnect={handleConnect} />
      </div>

      <AlertDialog open={isConnecting}>
        <AlertDialogContent className='[&>button]:hidden'>
          <AlertDialogHeader>
            <AlertDialogTitle>Connecting Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Please wait while we establish your connection...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex items-center justify-center h-20 w-full'>
            <Icons.loader className='w-10 h-10 animate-spin' />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
