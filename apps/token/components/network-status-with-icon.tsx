'use client';

import {
  useActiveWalletChain,
  useActiveWalletConnectionStatus,
} from 'thirdweb/react';
import { Badge } from '@mjs/ui/primitives/badge';
import { cn } from '@mjs/ui/lib/utils';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

interface NetworkStatusWithIconProps {
  className?: string;
  showChainId?: boolean;
  showIcon?: boolean;
  compact?: boolean;
}

/**
 * Enhanced network status component with icons and detailed information
 */
export const NetworkStatusWithIcon = ({
  className,
  showChainId = false,
  showIcon = true,
  compact = false,
}: NetworkStatusWithIconProps) => {
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
        icon: Loader2,
        variant: 'secondary' as const,
      };
    }

    if (!isConnected) {
      return {
        name: 'Disconnected',
        status: 'disconnected' as const,
        color: 'bg-gray-400',
        icon: WifiOff,
        variant: 'secondary' as const,
      };
    }

    if (!chain) {
      return {
        name: 'Unknown Network',
        status: 'unknown' as const,
        color: 'bg-orange-500',
        icon: AlertCircle,
        variant: 'secondary' as const,
      };
    }

    return {
      name: chain.name || `Chain ${chain.id}`,
      status: 'connected' as const,
      color: 'bg-green-500',
      icon: Wifi,
      variant: 'default' as const,
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <Badge
      variant={statusInfo.variant}
      className={cn('flex items-center gap-1.5 transition-colors', className)}
    >
      {showIcon && (
        <IconComponent
          className={cn('w-3 h-3', isConnecting && 'animate-spin')}
        />
      )}

      <div
        className={cn(
          'w-2 h-2 rounded-full',
          statusInfo.color,
          isConnecting && 'animate-pulse'
        )}
      />

      <span
        className={cn('text-sm font-medium', compact && 'hidden sm:inline')}
      >
        {statusInfo.name}
      </span>

      {showChainId && chain && (
        <span className='text-xs opacity-70'>({chain.id})</span>
      )}
    </Badge>
  );
};
