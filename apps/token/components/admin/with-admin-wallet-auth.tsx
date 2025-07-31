'use client';

import { AdminWalletGuard } from './admin-wallet-guard';
import { ReactNode, useState } from 'react';

interface WithAdminWalletAuthProps {
  action: string;
  data?: Record<string, unknown>;
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
  dialogTitle?: string;
  dialogDescription?: string;
  enabled?: boolean;
}

/**
 * Component that renders content only when admin wallet is authenticated
 */
export const AdminWalletProtected = ({
  action,
  data,
  children,
  fallback,
  showDialog = true,
  dialogTitle,
  dialogDescription,
  enabled = true,
}: WithAdminWalletAuthProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleUnauthenticated = () => {
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <AdminWalletGuard
      enabled={enabled}
      action={action}
      data={data}
      showDialog={showDialog}
      dialogTitle={dialogTitle}
      dialogDescription={dialogDescription}
      onAuthenticated={handleAuthenticated}
      onUnauthenticated={handleUnauthenticated}
    >
      {children}
    </AdminWalletGuard>
  );
};
