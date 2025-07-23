import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from '@/common/config/constants';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const Decimal = Prisma.Decimal;
export const InvestFormSchema = z
  .object({
    paid: z.object({
      amount: z.string().min(1, 'Amount is required'),
      currency: z.string().min(1, 'Currency is required'),
      quantity: z.coerce.string(),
      ppu: z.string(),
    }),
    base: z.object({
      ppu: z.string(),
      currency: z.string(),
      min: z.number().default(1),
      max: z.number().default(0),
    }),
    tokenSymbol: z.string(),
    saleId: z.string().min(1, 'Sale ID is required').trim(),
    receivingWallet: z
      .string({
        invalid_type_error: 'Invalid EVM compatible address',
        required_error: 'EVM compatible address address required',
      })
      .min(1, 'Wallet address required')
      .regex(/^0x[a-fA-F0-9]{40}$/g)
      .trim(),
    requiresKYC: z.boolean(),
    requiresSaft: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.paid.amount && new Decimal(v.paid.amount).lessThanOrEqualTo(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount cannot be inferior to 0',
        path: ['paid', 'amount'],
      });
      return z.NEVER;
    }
    if (
      v.paid.currency &&
      ![...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES].includes(v.paid.currency)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Currency is not supported',
        path: ['paid', 'currency'],
      });
      return z.NEVER;
    }
    if (v.paid.quantity && new Decimal(v.paid.quantity).lessThanOrEqualTo(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quantity cannot be inferior to 0',
        path: ['paid', 'quantity'],
      });
      return z.NEVER;
    }
    if (
      v.base.min &&
      v.paid.quantity &&
      new Decimal(v.paid.ppu).lessThanOrEqualTo(0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Price per unit cannot be inferior to 0',
        path: ['paid', 'ppu'],
      });
      return z.NEVER;
    }
  });
