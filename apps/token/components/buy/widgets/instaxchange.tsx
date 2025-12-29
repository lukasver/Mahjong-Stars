'use client';

import { Icons } from '@mjs/ui/components/icons';
import { motion, StaggeredRevealAnimation } from '@mjs/ui/components/motion';
import PaymentMethodSelector, {
  PaymentMethodSelectorSkeleton,
} from '@mjs/ui/components/payment-options';
import { cn } from '@mjs/ui/lib/utils';
import { Alert, AlertDescription } from '@mjs/ui/primitives/alert';
import { Button } from '@mjs/ui/primitives/button';
import { toast } from '@mjs/ui/primitives/sonner';
import { AlertTriangle } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { TransactionByIdWithRelations } from '@/common/types/transactions';
import { useInstaxchangeSession } from '@/components/hooks/use-instaxchange-session';
import { PulseLoader } from '@/components/pulse-loader';
import { CreateSessionRequest } from '@/lib/services/instaxchange/types';
import { PaymentLimitsDialog } from '../payment-limits-kyc-dialog';
import PaymentInfoTooltip from './payment-info';

export type SuccessInstaxchangePaymentData = {
  id: string;
  comment?: string;
  transactionHash: string;
  amountPaid: string;
  paidCurrency: string;
  formOfPayment: 'CARD';
  paymentDate: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Instaxchange payment widget component props
 */
interface InstaxchangeWidgetProps {
  txId: TransactionByIdWithRelations['id'];
  method: CreateSessionRequest['method'];
  // onSuccess: (data: SuccessInstaxchangePaymentData) => void;
  onError?: (error: string) => void;
  errorComponent?: React.ReactNode;
}

/**
 * Instaxchange payment widget component
 * Embeds Instaxchange iframe for Apple Pay/Google Pay payments
 */
const InstaxchangeWidgetComponent = ({
  txId,
  method,
  onError,
  errorComponent = null,
}: InstaxchangeWidgetProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { sessionUrl, isLoading, error } = useInstaxchangeSession({
    transactionId: txId,
    method,
    onError,
  });

  if (isLoading) {
    return <PaymentMethodSelectorSkeleton />;
  }

  // Combine session creation error and payment error
  const displayError = error;

  if (displayError && !sessionUrl) {
    return (
      errorComponent || (
        <div className='space-y-4 p-4'>
          <div className='rounded-lg border border-destructive bg-destructive/10 p-4'>
            <h3 className='font-semibold text-destructive'>Payment Error</h3>
            <p className='text-sm text-destructive/80'>{displayError}</p>
          </div>
        </div>
      )
    );
  }

  if (!sessionUrl) {
    return (
      <div className='space-y-4 p-4 mx-auto w-full'>
        <PulseLoader text='Preparing payment session...' />
      </div>
    );
  }

  return (
    // <Activity mode={!sessionUrl ? "visible" : "hidden"}>
    <StaggeredRevealAnimation isVisible={!!sessionUrl}>
      <div className='space-y-4'>
        <div className='w-full flex justify-center'>
          <PaymentInfoTooltip text='Have questions?' showSupport />
        </div>
        <div className='relative w-full'>
          {sessionUrl && method === 'apple-pay' ? (
            <ApplePayHandler src={sessionUrl} txId={txId} />
          ) : (
            <InstaxchangeIframe src={sessionUrl} ref={iframeRef} />
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Alert className='border-secondary-300'>
            <Icons.infoCircle className='stroke-secondary-300' />
            <AlertDescription className='text-foreground'>
              Your payment is processed securely by our partner's. <br />
              After successfully completing the payment your purchase will be
              confirmed via email.
            </AlertDescription>
          </Alert>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Alert className='border-secondary-300'>
            <Icons.infoCircle className='stroke-secondary-300' />
            <AlertDescription className='text-foreground'>
              Loading taking longer than expected? If the screen hasn't loaded
              before starting the payment flow after 1 minute, refresh the page
              and try again.
            </AlertDescription>
          </Alert>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Alert className='border-secondary-300'>
            <AlertTriangle className='stroke-destructive' />
            <AlertDescription className='text-foreground'>
              Avoid changing the recipient address after the payment is
              initiated, this could result in your transaction being cancelled
              and your funds being lost.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </StaggeredRevealAnimation>
    // </Activity>
  );
};

const InstaxchangeIframe = memo(function Iframe({
  src,
  ref,
}: {
  src: string;
  ref: React.RefObject<HTMLIFrameElement | null>;
}) {
  const handleIframeMessage = useCallback((event: unknown) => {
    console.debug('EVENT:', event);
  }, []);

  /**
   * Set up postMessage listener for iframe communication
   */
  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('message', handleIframeMessage);
    }
    return () => {
      ref.current?.removeEventListener('message', handleIframeMessage);
    };
  }, [handleIframeMessage, ref]);

  return (
    <iframe
      ref={ref}
      src={src}
      title='Instaxchange Payment'
      className='h-full w-full rounded-lg border border-border min-h-[90vh] md:min-h-screen]'
      allow='clipboard-read; clipboard-write; fullscreen; payment'
      sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
      referrerPolicy='strict-origin-when-cross-origin'
      style={{
        width: '100%',
        height: '100%',
        border: '0',
      }}
      allowFullScreen
    />
  );
});

type PaymentProcessors = Extract<
  CreateSessionRequest['method'],
  'card' | 'apple-pay' | 'google-pay'
>;

export const Instaxchange = InstaxchangeWidgetComponent;

/**
 * Instaxchange component with paymentp processor selection
 */
export const InstaxchangeWidget = ({
  txId,
  // onSuccess,
  onError,
}: Omit<InstaxchangeWidgetProps, 'method'>) => {
  const [paymentProcessor, setPaymentProcessor] =
    useState<null | PaymentProcessors>(null);

  if (!paymentProcessor) {
    return (
      <PaymentMethodSelector
        header={
          <div className='flex items-center justify-between w-full'>
            <h3 className='text-lg font-semibold text-white flex-1'>
              Select Payment Method
            </h3>
            <PaymentLimitsDialog
              method='CARD'
              trigger={
                <Button
                  variant='link'
                  size='sm'
                  className='!h-fit text-secondary-300 underlined !p-0 shrink-0 text-sm text-center mb-2'
                >
                  View limits
                </Button>
              }
            />
          </div>
        }
        className='p-6 md:p-0 pt-0'
        onSelect={(method) => {
          if (
            method === 'card' ||
            method === 'apple-pay' ||
            method === 'google-pay'
          ) {
            setPaymentProcessor(method);
          }
        }}
        allowedMethods={
          ['card', 'apple-pay', 'google-pay'] as PaymentProcessors[]
        }
      />
    );
  }

  return (
    <Instaxchange
      method={paymentProcessor}
      txId={txId}
      // onSuccess={onSuccess}
      onError={onError}
    />
  );
};

/**
 * Handles Apple Pay payment by opening a new window and monitoring transaction status
 */
const ApplePayHandler = memo(function ApplePayHandler({
  src,
  txId,
}: {
  src: string;
  txId: string;
}) {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [openButton, setOpenButton] = useState(false);

  const handleOpenPaymentWindow = () => {
    window.open(src, '_blank', 'noopener,noreferrer');
    setIsWindowOpen(true);
  };

  /**
   * Open payment window when component mounts or src changes
   */
  useEffect(() => {
    if (!src || isWindowOpen) return;

    try {
      handleOpenPaymentWindow();
    } catch (_e) {
      toast.error('Payment window could not be opened. Please try again.');
      setOpenButton(true);
    }
  }, [src, isWindowOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isWindowOpen) {
      timer = setTimeout(() => setOpenButton(true), 5000);
    } else {
      setOpenButton(false);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isWindowOpen]);

  return (
    <div className='space-y-4 p-6 !rounded-lg border border-secondary bg-card glassy'>
      <div className='flex items-center gap-3'>
        <div className='flex-shrink-0'>
          <div className='w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center'>
            <Icons.infoCircle className='w-6 h-6 text-secondary-300' />
          </div>
        </div>
        <div className='flex-1'>
          <h3 className='font-semibold text-foreground mb-1'>
            Payment Window Opened
          </h3>
          <p className='text-sm text-foreground'>
            {isWindowOpen
              ? 'Please complete your payment in the new window. This page will automatically update when payment is confirmed.'
              : "The payment window has been closed. If you haven't completed the payment, please refresh this page to open it again."}
          </p>
        </div>
      </div>
      <div className='flex gap-4 justify-between'>
        <Button
          onClick={() => {
            window.location.reload();
          }}
          variant='outline'
          className={cn('flex-1', !isWindowOpen && 'hidden')}
        >
          Restart payment process
        </Button>
        <Button
          onClick={() => {
            handleOpenPaymentWindow();
            setOpenButton(false);
          }}
          variant='default'
          disabled={!openButton}
          className='flex-1'
        >
          Open payment window
        </Button>
      </div>
    </div>
  );
});
