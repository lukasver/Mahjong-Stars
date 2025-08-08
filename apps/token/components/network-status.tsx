'use client';

import {
  useActiveWalletChain,
  useActiveWalletConnectionStatus,
} from 'thirdweb/react';
import { Badge } from '@mjs/ui/primitives/badge';
import { cn } from '@mjs/ui/lib/utils';

interface NetworkStatusProps {
  className?: string;
  showChainId?: boolean;
  compact?: boolean;
}

/**
 * Displays the current network connection status with visual indicators
 */
export const NetworkStatus = ({
  className,
  showChainId = false,
  compact = false,
}: NetworkStatusProps) => {
  const chain = useActiveWalletChain();
  const status = useActiveWalletConnectionStatus();

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        name: 'Connecting...',
        status: 'connecting' as const,
        color: 'bg-yellow-500',
      };
    }

    if (!isConnected) {
      return {
        name: 'Disconnected',
        status: 'disconnected' as const,
        color: 'bg-gray-400',
      };
    }

    if (!chain) {
      return {
        name: 'Unknown Network',
        status: 'unknown' as const,
        color: 'bg-orange-500',
      };
    }

    return {
      name: chain.name || `Chain ${chain.id}`,
      status: 'connected' as const,
      color: 'bg-green-500',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge
      variant={statusInfo.status === 'connected' ? 'default' : 'secondary'}
      className={cn('flex items-center gap-1.5 transition-colors', className)}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full animate-pulse',
          statusInfo.color,
          isConnecting && 'animate-pulse'
        )}
      />

      <span
        className={cn(
          'text-xs sm:text-sm font-medium',
          compact && 'hidden sm:inline'
        )}
      >
        {statusInfo.name}
      </span>

      {showChainId && chain && (
        <span className='text-xs opacity-70'>({chain.id})</span>
      )}
    </Badge>
  );
};
