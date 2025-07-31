'use client';

import { AdminWalletProtected } from '../with-admin-wallet-auth';
import { ReactNode } from 'react';

interface SensitiveActionWrapperProps {
  action: string;
  saleId?: string;
  data?: Record<string, unknown>;
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
  dialogTitle?: string;
  dialogDescription?: string;
  enabled?: boolean;
}

/**
 * Wrapper component for sensitive admin actions that require wallet authentication
 */
export const SensitiveActionWrapper = ({
  action,
  data,
  children,
  fallback,
  showDialog = true,
  dialogTitle,
  enabled = true,
  dialogDescription,
}: SensitiveActionWrapperProps) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <AdminWalletProtected
      action={action}
      data={data}
      enabled={enabled}
      showDialog={showDialog}
      dialogTitle={dialogTitle}
      dialogDescription={dialogDescription}
      fallback={fallback}
    >
      {children}
    </AdminWalletProtected>
  );
};

/**
 * Higher-order component for wrapping sensitive admin actions
 */
export const WithSensitiveAction = (action: string, defaultSaleId?: string) => {
  return function WithSensitiveAction<P extends object>(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function SensitiveActionComponent(
      props: P & {
        saleId?: string;
        data?: Record<string, unknown>;
        showDialog?: boolean;
        dialogTitle?: string;
        dialogDescription?: string;
      }
    ) {
      const {
        saleId = defaultSaleId,
        data,
        showDialog = true,
        dialogTitle,
        dialogDescription,
        ...componentProps
      } = props;

      return (
        <SensitiveActionWrapper
          action={action}
          saleId={saleId}
          data={data}
          showDialog={showDialog}
          dialogTitle={dialogTitle}
          dialogDescription={dialogDescription}
        >
          <WrappedComponent {...(componentProps as P)} />
        </SensitiveActionWrapper>
      );
    };
  };
};
