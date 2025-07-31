import React, { useState, useRef } from 'react';
import { useNetwork } from 'wagmi';
import { Copy, Check, Edit, ExternalLink } from 'lucide-react';
import { Button } from '@mjs/ui/primitives/button';
import { Input } from '@mjs/ui/primitives/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@mjs/ui/primitives/tooltip';
import { CryptoRowTransaction } from './transactions';

/**
 * Formats a wallet address by trimming it to show only the first and last few characters
 * @param address - The wallet address to format
 * @param length - The number of characters to show from each end
 * @returns The formatted wallet address
 */
const formatWalletAddress = (address: string, length: number = 8): string => {
  if (!address || address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

/**
 * Component for displaying and editing transaction IDs
 */
export const TransactionID = ({
  value,
  row,
}: {
  value: string;
  id: string;
  row: CryptoRowTransaction;
}) => {
  const { chain } = useNetwork();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlTxHash = chain?.blockExplorers?.default?.url;
  const TRANSACTION_TYPE_CRYPTO = row.type === 'Crypto';

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleConfirm = () => {
    setIsEditing(false);
    // Here you would typically save the edited value
    // For now, we'll just close the edit mode
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!value) {
    return (
      <div className='flex items-center gap-2'>
        {isEditing ? (
          <div className='flex items-center gap-2'>
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className='w-48'
            />
            <Button
              size='sm'
              variant='ghost'
              onClick={handleConfirm}
              className='h-8 w-8 p-0'
            >
              <Check className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <Button
            size='sm'
            variant='ghost'
            onClick={handleEdit}
            className='h-8 w-8 p-0'
          >
            <Edit className='h-4 w-4' />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-2'>
        <span className='font-mono text-sm'>
          {TRANSACTION_TYPE_CRYPTO ? formatWalletAddress(value, 8) : value}
        </span>

        <div className='flex items-center gap-1'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => copyToClipboard(value)}
                  className='h-6 w-6 p-0'
                >
                  <Copy className='h-3 w-3' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {TRANSACTION_TYPE_CRYPTO && urlTxHash && value && (
            <Tooltip content={<p>View on explorer</p>}>
              <Button size='sm' variant='ghost' asChild className='h-6 w-6 p-0'>
                <a
                  href={`${urlTxHash}/tx/${value}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ExternalLink className='h-3 w-3' />
                </a>
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
