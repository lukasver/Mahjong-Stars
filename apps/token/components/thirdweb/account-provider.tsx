'use client';

import { ConnectWallet } from '@/components/connect-wallet';
import { client } from '@/lib/auth/thirdweb-client';
import { Icons } from '@mjs/ui/components/icons';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';
import { Button } from '@mjs/ui/primitives/button';
import React from 'react';
import { AccountProvider as AccountProviderThirdweb } from 'thirdweb/react';
import useActiveAccount from '../hooks/use-active-account';

const IS_DEV = process.env.NODE_ENV === 'development';

function AccountProvider({ children }: { children: React.ReactNode }) {
  const { activeAccount, status, signout, isLoading } = useActiveAccount();

  const handleClose = async () => {
    await signout();
  };

  // In development we don't care if wallet is connected
  if (IS_DEV) {
    return (
      <AccountProviderThirdweb
        address={'0x8f75517e97e0bB99A2E2132FDe0bBaC5815Bac70'}
        client={client}
      >
        {children}
      </AccountProviderThirdweb>
    );
  }

  if (status === 'disconnected') {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className='flex items-center justify-between gap-2'>
              <AlertDialogTitle className='flex-1'>
                Please connect your wallet
              </AlertDialogTitle>
              <Button
                variant='ghost'
                size='icon'
                tabIndex={-1}
                onClick={() => {
                  handleClose();
                }}
                loading={isLoading}
              >
                <Icons.x className='w-4 h-4' />
              </Button>
            </div>
            {/* <AlertDialogDescription>Lorem</AlertDialogDescription> */}
          </AlertDialogHeader>
          <ConnectWallet />
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (status === 'unknown' || status === 'connecting') {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connecting...</AlertDialogTitle>
            <AlertDialogDescription>Please wait</AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex items-center justify-center h-full w-full'>
            <Icons.loader className='w-10 h-10 animate-spin' />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (activeAccount) {
    return (
      <AccountProviderThirdweb address={activeAccount.address} client={client}>
        {children}
      </AccountProviderThirdweb>
    );
  }

  if (status === 'connected') {
    return (
      <div className='h-screen w-screen grid place-items-center'>
        <Icons.loader className='w-10 h-10 animate-spin' />
      </div>
    );
  }

  return null;
}

export default AccountProvider;
