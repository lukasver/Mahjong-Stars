'use client';

import useActiveAccount from '@/components/hooks/use-active-account';
import { useCallback, useState } from 'react';
import { toast } from '@mjs/ui/primitives/sonner';
import { useAction } from 'next-safe-action/hooks';

import { AdminActionPayload } from '@/lib/auth/admin-wallet-auth';
import { verifyAdminAction } from '@/lib/actions/admin';

interface UseAdminWalletAuthOptions {
  action: string;
  saleId?: string;
  data?: Record<string, unknown>;
}

interface AdminWalletAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Hook for handling admin wallet authentication for sensitive actions
 */
export const useAdminWalletAuth = ({
  action,
  saleId,
  data,
}: UseAdminWalletAuthOptions) => {
  const { activeAccount, signMessage, chainId } = useActiveAccount();
  const [state, setState] = useState<AdminWalletAuthState>({
    isLoading: false,
    isAuthenticated: false,
    error: null,
  });

  const verifyAction = useAction(verifyAdminAction);

  /**
   * Request wallet signature for admin action
   */
  const requestSignature = useCallback(async () => {
    if (!activeAccount) {
      setState((prev) => ({ ...prev, error: 'No wallet connected' }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Generate payload for signature
      const payload: AdminActionPayload = {
        action,
        timestamp: Date.now(),
        saleId,
        data,
      };

      const messageToSign = JSON.stringify(payload);

      // Request signature from wallet
      const signature = await signMessage(messageToSign);

      if (!signature) {
        throw new Error('Failed to get signature from wallet');
      }

      if (!chainId) {
        throw new Error('No chain ID retrieved from wallet');
      }

      // Verify signature on server
      const result = await verifyAction.executeAsync({
        payload,
        signature,
        address: activeAccount.address,
        chainId,
      });

      if (result?.data?.valid) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        toast.success('Admin authentication successful');
        return true;
      } else {
        const error =
          result?.serverError ||
          result?.validationErrors?._errors?.join(', ') ||
          'Verification failed';
        setState({
          isLoading: false,
          isAuthenticated: false,
          error,
        });
        toast.error(`Authentication failed: ${error}`);
        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        isLoading: false,
        isAuthenticated: false,
        error: errorMessage,
      });
      toast.error(`Authentication failed: ${errorMessage}`);
      return false;
    }
  }, [activeAccount, action, saleId, data, signMessage, verifyAction]);

  /**
   * Reset authentication state
   */
  const resetAuth = useCallback(() => {
    setState({
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    requestSignature,
    resetAuth,
    isWalletConnected: !!activeAccount,
  };
};
