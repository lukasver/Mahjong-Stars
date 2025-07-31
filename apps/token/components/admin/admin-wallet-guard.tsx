'use client';

import { useAdminWalletAuth } from '@/components/hooks/use-admin-wallet-auth';
import { Button } from '@mjs/ui/primitives/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';
import { useTranslations } from 'next-intl';
import { ReactNode, useEffect } from 'react';
import { AlertCircleIcon, WalletIcon } from 'lucide-react';
import { ConnectWallet } from '../connect-wallet';

interface AdminWalletGuardProps {
  action: string;
  data?: Record<string, unknown>;
  children: ReactNode;
  onAuthenticated?: () => void;
  onUnauthenticated?: () => void;
  showDialog?: boolean;
  dialogTitle?: string;
  dialogDescription?: string;
  enabled?: boolean;
}

/**
 * Component that guards sensitive admin actions by requiring wallet signature
 */
export const AdminWalletGuard = ({
  action,
  data,
  children,
  onAuthenticated,
  onUnauthenticated,
  showDialog = true,
  dialogTitle,
  dialogDescription,
  enabled = true,
}: AdminWalletGuardProps) => {
  const t = useTranslations('admin.wallet');
  const {
    isLoading,
    isAuthenticated,
    error,
    requestSignature,
    resetAuth,
    isWalletConnected,
  } = useAdminWalletAuth({ action, data });

  const handleRequestSignature = async () => {
    const success = await requestSignature();
    if (success && onAuthenticated) {
      onAuthenticated();
    } else if (!success && onUnauthenticated) {
      onUnauthenticated();
    }
  };

  useEffect(() => {
    if (isAuthenticated && onAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  // If not authenticated and dialog is disabled, show nothing
  if (!isAuthenticated && !showDialog) {
    return null;
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and dialog is enabled, show authentication dialog
  if (showDialog && enabled) {
    return (
      <AlertDialog open={enabled}>
        <AlertDialogContent className='sm:max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogTitle || t('authenticationRequired')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogDescription || t('authenticationDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Card className='mt-4'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium'>
                {t('adminAction')}: {action}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!isWalletConnected ? (
                <div className='text-center py-4'>
                  <WalletIcon className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>
                    {t('connectWalletFirst')}
                  </p>
                  <ConnectWallet />
                </div>
              ) : error ? (
                <div className='text-center py-4'>
                  <AlertCircleIcon className='w-8 h-8 mx-auto mb-2 text-destructive' />
                  <p className='text-sm text-destructive'>{error}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={resetAuth}
                    className='mt-2'
                  >
                    {t('tryAgain')}
                  </Button>
                </div>
              ) : (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>{t('action')}:</span>
                    <span className='font-mono text-xs'>{action}</span>
                  </div>

                  <div className='flex items-center justify-between text-sm'>
                    <span>{t('timestamp')}:</span>
                    <span className='font-mono text-xs'>
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className='flex justify-end gap-2 mt-4'>
            {isWalletConnected && !error && (
              <Button
                onClick={handleRequestSignature}
                disabled={isLoading}
                className='flex-1'
                loading={isLoading}
              >
                {isLoading ? (
                  t('signing')
                ) : (
                  <>
                    <WalletIcon className='w-4 h-4 mr-2' />
                    {t('signWithWallet')}
                  </>
                )}
              </Button>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
};
