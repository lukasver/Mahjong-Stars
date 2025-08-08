import { AlertCircle, Clock, Lock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@mjs/ui/primitives/alert';

/**
 * FormError component to display different error states when forms need to be blocked
 */
export interface FormErrorProps {
  type:
    | 'sale-ended'
    | 'maintenance'
    | 'wallet-required'
    | 'kyc-required'
    | 'network-error'
    | 'insufficient-funds'
    | 'custom';
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const FormError = ({ type, title, message, icon }: FormErrorProps) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'sale-ended':
        return {
          title: 'Investment Period Ended',
          message:
            'This token sale has concluded and is no longer accepting new investments. Thank you for your interest.',
          icon: <XCircle className='h-4 w-4 text-red-500' />,
          className:
            'border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950/50',
        };
      case 'maintenance':
        return {
          title: 'System Maintenance',
          message:
            'The investment platform is currently under maintenance. Please try again later.',
          icon: <Clock className='h-4 w-4 text-yellow-500' />,
          className:
            'border-yellow-200 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950/50',
        };
      case 'wallet-required':
        return {
          title: 'Wallet Connection Required',
          message:
            'Please connect your wallet to continue with the investment process.',
          icon: <Lock className='h-4 w-4 text-blue-500' />,
          className:
            'border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50',
        };
      case 'kyc-required':
        return {
          title: 'KYC Verification Required',
          message:
            'Please complete your KYC verification before making an investment.',
          icon: <AlertCircle className='h-4 w-4 text-orange-500' />,
          className:
            'border-orange-200 bg-orange-100 dark:border-orange-800 dark:bg-orange-950/50',
        };
      case 'network-error':
        return {
          title: 'Network Error',
          message:
            'Unable to connect to the network. Please check your internet connection and try again.',
          icon: <AlertCircle className='h-4 w-4 text-red-500' />,
          className:
            'border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950/50',
        };
      case 'insufficient-funds':
        return {
          title: 'Insufficient Funds',
          message:
            'Your wallet does not have enough funds to complete this transaction.',
          icon: <AlertCircle className='h-4 w-4 text-red-500' />,
          className:
            'border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950/50',
        };
      case 'custom':
        return {
          title: title || 'Error',
          message: message || 'Please try again later or contact support.',
          icon: icon || <AlertCircle className='h-4 w-4 text-red-500' />,
          className:
            'border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950/50',
        };
    }
  };

  const content = getDefaultContent();

  return (
    <Alert className={content.className}>
      {content.icon}
      <AlertDescription className='text-white/90 space-y-1'>
        <h4 className='text-xs sm:text-sm font-medium text-red-800 dark:text-red-200'>
          {content.title}
        </h4>
        <p className='text-xs text-red-700 dark:text-red-300'>
          {content.message}
        </p>
      </AlertDescription>
    </Alert>
  );
};
