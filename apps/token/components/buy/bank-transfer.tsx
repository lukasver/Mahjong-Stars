import { toast } from '@mjs/ui/primitives/sonner';
import { Icons } from '@mjs/ui/components/icons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Button } from '@mjs/ui/primitives/button';
import { Separator } from '@mjs/ui/primitives/separator';
import { copyToClipboard } from '@mjs/utils/client';
import { formatCurrency } from '@mjs/utils/client';
import { Prisma } from '@prisma/client';

interface BankTransferProps {
  onClose: () => void;
  value: Prisma.Decimal | number | string;
  currency: string;
  onConfirm: () => void;
}

const BankTransfer = ({
  onClose,
  value,
  currency,
  onConfirm,
}: BankTransferProps) => {
  if (!value || Number.isNaN(Number(value))) {
    toast.error(
      'Unexpected error, please refresh page or contact administrator'
    );
    return null;
  }

  const formattedValue = formatCurrency(value, {
    locale: 'en-US',
    currency,
  });

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold text-center'>
          Bank Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='text-center'>
          <p className='text-lg font-medium'>Smat S.A</p>
          <p className='text-sm text-muted-foreground'>
            Rue de l'Avenir 23 - 2800 Délemont - Switzerland
          </p>
        </div>

        {dataTransfer.map(({ subtitle, iban, bic }, index) => (
          <div key={index} className='space-y-3'>
            <h3 className='text-lg font-medium'>{subtitle}</h3>
            <Separator />
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>IBAN: {iban}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => copyToClipboard(iban.trim())}
                >
                  <Icons.copy className='h-4 w-4' />
                </Button>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>BIC: {bic}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => copyToClipboard(bic.trim())}
                >
                  <Icons.copy className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className='flex items-center gap-2 pt-4'>
          <span className='text-lg font-medium text-primary'>TO PAY:</span>
          <span className='text-lg font-medium'>{formattedValue}</span>
        </div>

        <div className='text-center'>
          <p className='text-xs text-muted-foreground'>
            ( This transaction will be canceled in 6 hours if payment is not
            confirmed )
          </p>
        </div>

        <div className='flex gap-4 pt-4'>
          <Button variant='outline' className='flex-1' onClick={onClose}>
            Close
          </Button>
          <Button variant='default' className='flex-1' onClick={onConfirm}>
            Confirm Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const dataTransfer = [
  {
    subtitle: 'For CHF',
    iban: ' CH71 8080 8002 6358 1785 0 ',
    bic: ' RAIFCH22',
  },
  {
    subtitle: 'For EUR',
    iban: ' GB38REVO00996909546892 ',
    bic: ' REVOGB21',
  },
];

export default BankTransfer;
