'use client';

import { useAdminWalletAuth } from './use-admin-wallet-auth';
import { useCallback, useState } from 'react';
import { toast } from '@mjs/ui/primitives/sonner';

interface UseSensitiveActionOptions {
  action: string;
  saleId?: string;
  data?: Record<string, unknown>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface SensitiveActionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for handling sensitive admin actions with wallet authentication
 */
export const useSensitiveAction = ({
  action,
  saleId,
  data,
  onSuccess,
  onError,
}: UseSensitiveActionOptions) => {
  const [state, setState] = useState<SensitiveActionState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const {
    isLoading: authLoading,
    isAuthenticated: authAuthenticated,
    error: authError,
    requestSignature,
    resetAuth,
    isWalletConnected,
  } = useAdminWalletAuth({ action, saleId, data });

  /**
   * Execute a sensitive action with wallet authentication
   */
  const executeAction = useCallback(
    async (actionFn: () => Promise<void> | void) => {
      if (!isWalletConnected) {
        const error = 'Wallet not connected';
        setState((prev) => ({ ...prev, error }));
        onError?.(error);
        toast.error(error);
        return false;
      }

      if (!authAuthenticated) {
        setState((prev) => ({ ...prev, isLoading: true }));

        const success = await requestSignature();

        if (!success) {
          const error = authError || 'Authentication failed';
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error,
            isAuthenticated: false,
          }));
          onError?.(error);
          return false;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        }));
      }

      // Execute the actual action
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        await actionFn();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Action failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        onError?.(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    },
    [
      isWalletConnected,
      authAuthenticated,
      authError,
      requestSignature,
      onSuccess,
      onError,
    ]
  );

  /**
   * Reset the authentication state
   */
  const reset = useCallback(() => {
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    resetAuth();
  }, [resetAuth]);

  return {
    ...state,
    executeAction,
    reset,
    isWalletConnected,
    authLoading,
    authAuthenticated,
  };
};
