'use client';

import { useMemo } from 'react';
import { AlertCircle, Wallet, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@mjs/ui/primitives/alert';
import { Button } from '@mjs/ui/primitives/button';

import { Badge } from '@mjs/ui/primitives/badge';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { useWalletBalance } from 'thirdweb/react';
import { client } from '@/lib/auth/thirdweb-client';
import useActiveAccount from '@/components/hooks/use-active-account';
import { useLocale } from 'next-intl';
import { copyToClipboard, safeFormatCurrency } from '@mjs/utils/client';
import { Decimal } from 'decimal.js';
import { toast } from '@mjs/ui/primitives/sonner';
import { FIAT_CURRENCIES } from '@/common/config/constants';

interface BalanceCheckerProps {
  /**
   * The required amount for the transaction
   */
  requiredAmount: string;
  /**
   * The payment token contract address
   */
  tokenAddress?: string;
  /**
   * The payment token symbol
   */
  tokenSymbol: string;
  /**
   * Whether the token is native (like ETH, BNB)
   */
  isNativeToken?: boolean;
  /**
   * The chain ID for the transaction
   */
  chainId: number;
  /**
   * Optional callback when user wants to add funds
   */
  onAddFunds?: () => void;
  /**
   * Optional callback when balance is checked. True if has enough funds, false if not.
   */
  onBalanceCheck?: (result: boolean) => void;
}

/**
 * Component to display wallet balance and provide instructions for insufficient funds
 */
export function BalanceChecker({
  requiredAmount,
  tokenAddress,
  tokenSymbol,
  isNativeToken = false,
  chainId,
  onAddFunds,
  onBalanceCheck,
}: BalanceCheckerProps) {
  const { activeAccount: account, chain } = useActiveAccount();
  const locale = useLocale();

  const { data: balance, isLoading } = useWalletBalance({
    client,
    address: account?.address,
    chain,
    tokenAddress: isNativeToken ? undefined : tokenAddress,
  });

  const balanceAmount = useMemo(() => {
    if (!balance) return '0';
    return balance.displayValue;
  }, [balance]);

  const hasInsufficientFunds = useMemo(() => {
    if (!balance || !requiredAmount) return false;
    const balanceDecimal = new Decimal(balanceAmount);
    const requiredDecimal = new Decimal(requiredAmount);
    const result = balanceDecimal.lessThan(requiredDecimal);
    onBalanceCheck?.(!result);
    return result;
  }, [balanceAmount, requiredAmount]);

  const getAddFundsInstructions = () => {
    const instructions = [];

    if (isNativeToken) {
      instructions.push(
        `Transfer ${tokenSymbol} to your wallet address: ${account?.address}`
      );
    } else {
      instructions.push(
        `Transfer ${tokenSymbol} tokens to your wallet address: ${account?.address}`
      );
    }

    // Add common instructions
    instructions.push(
      'You can purchase tokens from exchanges like Binance or other DEX platforms',
      'Make sure to use the correct network when transferring funds',
      'Wait for the transaction to be confirmed before proceeding'
    );

    return instructions;
  };

  const getNetworkName = () => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 56:
        return 'Binance Smart Chain';
      case 8453:
        return 'Base';
      case 11155111:
        return 'Sepolia Testnet';
      case 84532:
        return 'Base Sepolia Testnet';
      case 97:
        return 'BSC Testnet';
      default:
        return `Chain ID ${chainId}`;
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600'>
        <h4 className='text-white font-medium flex items-center gap-2'>
          <Wallet className='h-4 w-4' />
          Wallet Balance
        </h4>
        <div className='space-y-2 text-sm'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3 w-48' />
        </div>
      </div>
    );
  }

  if (!account?.address) {
    return (
      <Alert className='border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50'>
        <Wallet className='h-4 w-4 text-blue-500' />
        <AlertDescription className='text-white/90'>
          <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
            Wallet Not Connected
          </h4>
          <p className='text-xs text-blue-700 dark:text-blue-300'>
            Please connect your wallet to check your balance.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Balance Display */}
      <div className='space-y-3 p-3 sm:p-4 bg-slate-700/30 rounded-lg border border-slate-600'>
        <h4 className='text-white font-medium flex items-center gap-2'>
          <Wallet className='h-4 w-4' />
          <span className='text-sm sm:text-base'>Wallet Balance</span>
        </h4>
        <div className='space-y-2 text-xs sm:text-sm'>
          <div className='flex justify-between'>
            <span className='text-gray-400'>Available Balance:</span>
            <div className='flex items-center gap-2'>
              <span className='text-white'>
                {safeFormatCurrency(
                  {
                    totalAmount: balanceAmount,
                    currency: tokenSymbol,
                  },
                  {
                    locale,
                    precision: FIAT_CURRENCIES.includes(tokenSymbol)
                      ? 'FIAT'
                      : 'CRYPTO',
                  }
                )}
              </span>
              {hasInsufficientFunds && (
                <Badge variant='destructive' className='text-xs'>
                  Insufficient
                </Badge>
              )}
            </div>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-400'>Required Amount:</span>
            <span className='text-white'>
              {safeFormatCurrency(
                {
                  totalAmount: requiredAmount,
                  currency: tokenSymbol,
                },
                {
                  locale,
                  precision: 'CRYPTO',
                }
              )}
            </span>
          </div>

          <div className='text-xs text-secondary text-right'>
            Network: {getNetworkName()}
          </div>
        </div>
      </div>

      {/* Insufficient Funds Alert */}
      {hasInsufficientFunds && (
        <Alert>
          <AlertCircle className='size-4' />
          <AlertDescription className='text-secondary space-y-3'>
            <div>
              <h4 className='text-base font-medium '>Insufficient Balance</h4>
              <p className='text-sm text-foreground'>
                Your wallet doesn't have enough {tokenSymbol} to complete this
                transaction.
              </p>
            </div>

            <div className='space-y-2'>
              <h5 className='text-sm sm:text-base font-medium'>
                How to add funds:
              </h5>
              <ul className='text-xs sm:text-sm text-foreground space-y-1'>
                {getAddFundsInstructions().map((instruction, index) => (
                  <li key={index} className='flex items-start gap-2'>
                    <span className='text-secondary mt-0.5'>•</span>
                    <span className='break-words'>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex flex-col sm:flex-row gap-2 justify-end pt-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  copyToClipboard(account?.address);
                  toast.success('Wallet address copied to clipboard');
                }}
              >
                Copy Wallet Address
              </Button>

              {onAddFunds && (
                <Button size='sm' variant='accent' onClick={onAddFunds}>
                  <ExternalLink className='h-3 w-3 mr-1' />
                  Add Funds
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sufficient Funds Success */}
      {
        !hasInsufficientFunds && balance && null
        // <Alert className='bg-white/10 border-green-500'>
        //   <CheckCircle
        //     className='h-4 w-4'
        //     style={{ color: 'var(--color-green-500)' }}
        //   />
        //   <AlertDescription className='text-foreground'>
        //     <h4 className='text-sm font-medium text-green-500'>
        //       Sufficient Balance
        //     </h4>
        //     <p className='text-xs text-foreground'>
        //       Your wallet has enough {tokenSymbol} to complete this transaction.
        //     </p>
        //   </AlertDescription>
        // </Alert>
      }
    </div>
  );
}
