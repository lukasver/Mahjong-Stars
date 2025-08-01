'use client';

import { useState } from 'react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { FileUpload } from '@mjs/ui/components/file-upload';
import { Button } from '@mjs/ui/primitives/button';
import {
  associateDocumentsToUser,
  confirmTransaction,
  getFileUploadPrivatePresignedUrl,
} from '@/lib/actions';
import { uploadFile } from '@/lib/utils/files';
import {
  useCryptoTransaction,
  useSaleBanks,
  useTransactionAvailabilityForSale,
  useTransactionById,
} from '@/lib/services/api';
import { useParams } from 'next/navigation';
import { invariant } from '@epic-web/invariant';
import { toast } from '@mjs/ui/primitives/sonner';
import {
  BankDetailsCard,
  BankDetailsSkeleton,
} from '@/components/bank-details';
import { copyToClipboard, safeFormatCurrency } from '@mjs/utils/client';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { useLocale } from 'next-intl';
import { FIAT_CURRENCIES, ONE_MINUTE } from '@/common/config/constants';
import { isFileWithPreview } from './utils';
import { getQueryClient } from '@/app/providers';
import { TransactionByIdWithRelations } from '@/common/types/transactions';
import { BanknoteIcon } from 'lucide-react';
import { Placeholder } from '@/components/placeholder';
import { metadata } from '@/common/config/site';

import useActiveAccount from '@/components/hooks/use-active-account';
import { PurchaseSummaryCard } from '@/components/invest/summary';
interface PaymentStepProps {
  onSuccess: () => void;
}

/**
 * Step 3: Payment Step
 * Shows payment instructions and collects payment confirmation info.
 */
export function PaymentStep({ onSuccess }: PaymentStepProps) {
  const { tx: txId } = useParams();
  const { data: tx, isLoading } = useTransactionById(txId as string);

  if (isLoading)
    return (
      <CardContent>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Please follow the instructions below to complete your payment.
          </CardDescription>
        </CardHeader>
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <BankDetailsSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    );
  if (!tx) return <CardContent>Transaction not found.</CardContent>;

  // TODO: Confirm the correct path for payment fields and type properly
  const paymentMethod = tx?.transaction?.formOfPayment;

  return (
    <>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Please follow the instructions below to complete your payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethod === 'TRANSFER' ? (
          <FiatPayment tx={tx.transaction} onSuccess={onSuccess} />
        ) : (
          <CryptoPayment tx={tx.transaction} onSuccess={onSuccess} />
        )}
      </CardContent>
    </>
  );
}

const CryptoPayment = ({
  tx,
  onSuccess,
}: {
  tx: TransactionByIdWithRelations;
  onSuccess: () => void;
}) => {
  const { activeAccount: ac } = useActiveAccount();
  const locale = useLocale();
  const { data: cryptoTransaction, isLoading } = useCryptoTransaction(tx.id);

  return (
    <div className='py-2 text-center space-y-4'>
      <PurchaseSummaryCard
        purchased={{
          quantity: tx.quantity.toString(),
          tokenSymbol: tx.tokenSymbol,
        }}
        base={tx.quantity.toString()}
        total={tx.quantity.toString()}
        paid={{
          totalAmount: tx.totalAmount.toString(),
          currency: tx.paidCurrency,
        }}
        locale={locale}
      />
      <div className='mb-2'>
        <span className='font-medium'>Crypto payment</span> (coming soon)
      </div>
      {/* <div className='text-muted-foreground'>
        Please follow the instructions for crypto payment in the next step.
      </div> */}
      {/* {!isLoading && (
        <TransactionButton
          transaction={() => {
            const chain = cryptoTransaction?.blockchain;
            if (!chain) throw new Error('Contract not found');
            const contract = chain.contractAddress;
            if (!contract) throw new Error('Contract not found');
            const toWallet =
              cryptoTransaction.transaction.sale.toWalletsAddress;
            if (!toWallet) throw new Error('To wallet not found');
            const tx = cryptoTransaction.transaction;

            const twContract = getContract({
              client: client,
              chain: defineChain(chain.chainId),
              address: contract,
            });

            console.log('CHAIN', chain);
            // ERC-20
            if (chain.decimals === 18) {
              const txs = transferFrom({
                contract: twContract,
                amount: tx.totalAmount.toString(),
                from: ac?.address!,
                to: toWallet,
              });
              console.debug('🚀 ~ payment-step.tsx:172 ~ tx:', txs);

              return txs;
            } else {
              const txs = prepareContractCall({
                contract: twContract,
                method: resolveMethod('transferFrom'),
                params: [
                  '0x123...',
                  toUnits(tx.totalAmount.toString(), chain.decimals),
                ],
              });
              return txs;
            }
          }}
          // transaction={() => {
          //   // Create a transaction object and return it
          //   const tx = prepareContractCall({
          //     contract,
          //     method: "mint",
          //     params: [address, amount],
          //   });
          //   return tx;
          // }}
          onTransactionSent={(result) => {
            console.log('Transaction submitted', result.transactionHash);
          }}
          onTransactionConfirmed={(receipt) => {
            console.log('Transaction confirmed', receipt.transactionHash);
          }}
          onError={(error) => {
            console.error('Transaction error', error);
          }}
        >
          Confirm Transaction
        </TransactionButton>
      )} */}
    </div>
  );
};

const FiatPayment = ({
  tx,
  onSuccess,
}: {
  tx: TransactionByIdWithRelations;
  onSuccess: () => void;
}) => {
  const { data: banks, isLoading: isBanksLoading } = useSaleBanks(
    tx?.sale?.id || ''
  );
  const locale = useLocale();
  const [files, setFiles] = useState<unknown[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles the upload of the bank slip file.
   */
  const handleBankSlipChange = (fileList: unknown[]) => {
    setFiles(fileList.slice(0, 1));
    setError(null);
    setSuccess(false);
  };

  /**
   * Handles the payment confirmation submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      invariant(banks?.banks?.length, 'No banks found, try again later');
      invariant(tx, 'Transaction id could not be found');

      const saleId = tx.sale.id;
      const txId = tx.id;

      const validFiles = files
        .map((f) => (isFileWithPreview(f) ? f.file : null))
        .filter((f): f is File => !!f);
      const response = await Promise.all(
        validFiles.map(async (file) => {
          const key = `sale/${saleId}/tx/${txId}/${file.name}`;
          const urlRes = await getFileUploadPrivatePresignedUrl({ key });
          if (!urlRes?.data?.url) throw new Error('Failed to get upload URL');
          await uploadFile(file, urlRes.data.url).then();
          // Here i need to update our backend with refernece to the file
          return key;
        })
      );

      const keys = response.flatMap((key) => ({ key }));
      const [_associateResult, confirmResult] = await Promise.allSettled([
        associateDocumentsToUser({
          documents: keys,
          type: 'PAYMENT',
          transactionId: txId,
        }),
        confirmTransaction({
          id: txId,
        }).then(() => {
          const client = getQueryClient();
          const keys = [['transactions'], ['sales']];
          keys.forEach((key) => client.invalidateQueries({ queryKey: key }));
        }),
      ]);

      if (confirmResult.status === 'rejected') {
        throw confirmResult.reason;
      }

      setSuccess(true);
      setFiles([]);
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isBanksLoading && banks?.banks?.length === 0) {
    return (
      <Placeholder
        icon={BanknoteIcon}
        title='No config for transfer payment'
        description='Contact support'
      >
        <a href={`mailto:${metadata.supportEmail}`}>{metadata.supportEmail}</a>
      </Placeholder>
    );
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-foreground'>
        Proceed to pay{' '}
        <span className='font-medium '>
          {safeFormatCurrency(
            {
              totalAmount: tx?.amountPaid,
              currency: tx?.paidCurrency,
            },
            {
              locale,
              precision: FIAT_CURRENCIES.includes(tx?.paidCurrency)
                ? 'FIAT'
                : 'CRYPTO',
            }
          )}
        </span>{' '}
        to one of the following bank accounts & upload a proof of payment:
      </p>
      <ul className='space-y-4 max-h-[600px] overflow-y-auto'>
        {isBanksLoading ? (
          <Skeleton className='h-10 w-full' />
        ) : (
          banks?.banks.map((bank, index) => (
            <li key={bank.id || index}>
              <BankDetailsCard
                noSelectable
                onCopy={() => {
                  copyToClipboard(bank.iban);
                  toast.success('IBAN copied to clipboard');
                }}
                data={{
                  bankName: bank.bankName,
                  iban: bank.iban,
                  currency: bank.currency,
                  accountName: bank.accountName || '',
                  swift: bank.swift || '',
                  address: bank.address || '',
                  memo: bank.memo || '',
                }}
              />
            </li>
          ))
        )}
      </ul>
      <form className='space-y-4' onSubmit={handleSubmit}>
        <div>
          <label className='font-medium'>Upload Bank Transfer Receipt</label>
          <FileUpload
            type='all'
            maxSizeMB={5}
            className='w-full'
            multiple={false}
            onFilesChange={handleBankSlipChange}
          />
        </div>
        {error && <div className='text-destructive mt-2'>{error}</div>}
        {success && (
          <div className='text-success mt-2'>
            Payment confirmation submitted!
          </div>
        )}
        <Button
          type='submit'
          className='w-full'
          disabled={!banks?.banks?.length}
          variant='accent'
          loading={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment Confirmation'}
        </Button>
      </form>
    </div>
  );
};

/**
 * Used to check if the payment if the sale is still available for the transaction to render the payment page. If it is, render the children, otherwise renders an error component.
 */
export function PaymentAvailabilityGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tx: txId } = useParams();
  const { data } = useTransactionAvailabilityForSale(txId as string, {
    refetchInterval: ONE_MINUTE,
    enabled: !!txId,
    staleTime: ONE_MINUTE,
  });

  const isAvailable = data?.transaction === true;

  if (!isAvailable) {
    return <div>Transaction not available</div>;
  }

  return children;
}
