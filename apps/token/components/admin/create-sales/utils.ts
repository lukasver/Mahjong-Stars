import { FIAT_CURRENCIES } from '@/common/config/constants';
import { Sale } from '@/common/schemas/generated';
import { FormInputProps } from '@mjs/ui/primitives/form-input';
import { useTranslations } from 'next-intl';
import { type JSONContent } from '@mjs/ui/components/editor/advanced-editor';
import z from 'zod';

type SaleKeys = Partial<
  keyof Omit<
    Sale,
    | 'status'
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'createdBy'
    | 'tokenId'
    | 'tokenTotalSupply'
    | 'information'
  >
>;

export const formSchemaShape = {
  name: z.string().min(1, 'Sale name required'),
  tokenName: z.string().min(1, 'Token name required'),
  tokenSymbol: z
    .string()
    .max(6, 'Token symbol must be at most 6 characters')
    .min(1, 'Token symbol required'),
  tokenContractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/g, 'Invalid token contract address')
    .min(1, 'Token contract address required')
    .optional(),
  tokenContractChainId: z.coerce.number().int().optional(),
  tokenPricePerUnit: z.coerce
    .number()
    .min(0.001, 'Price per unit must be at least 0.001'),
  currency: z.enum(
    FIAT_CURRENCIES as unknown as [
      string,
      ...(typeof FIAT_CURRENCIES)[number][]
    ],
    {
      required_error: 'Sale currency required',
      invalid_type_error: 'Invalid currency',
    }
  ),
  toWalletsAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/g, 'Invalid wallet address')
    .min(1, 'Wallet address required'),
  saleStartDate: z.coerce
    .date()
    .min(
      new Date(new Date().setDate(new Date().getDate() - 1)),
      'Please choose a future date for the start date'
    ),
  saleClosingDate: z.coerce.date(),
  initialTokenQuantity: z.coerce
    .number()
    .int()
    .min(1, 'Initial token quantity must be at least 1')
    .min(1, 'Initial token quantity required'),
  availableTokenQuantity: z.coerce
    .number()
    .int()
    .min(0, 'Available token quantity must be at least 0')
    .max(
      Number.MAX_SAFE_INTEGER,
      'Available quantity cannot safe number quantity'
    )
    .min(1, 'Available token quantity required'),
  minimumTokenBuyPerUser: z.coerce
    .number()
    .int()
    .min(1, 'Minimum buy per user must be at least 1')
    .max(Number.MAX_SAFE_INTEGER, 'Minimum cannot safe number quantity')
    .min(1, 'Minimum buy per user required'),
  maximumTokenBuyPerUser: z.coerce
    .number()
    .int()
    .max(Number.MAX_SAFE_INTEGER, 'Maximum cannot safe number quantity')
    .nullable()
    .refine(
      (val: number | null) => val === null || val > -1,
      'Maximum buy per user must be 0 or greater'
    ),
  saftCheckbox: z.boolean().default(false),
} satisfies Record<SaleKeys, z.ZodType>;

export const SaleFormSchema = z
  .object(formSchemaShape)
  .superRefine((data, ctx) => {
    if (
      data.saleClosingDate &&
      data.saleStartDate &&
      data.saleClosingDate <= data.saleStartDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after the start date',
        path: ['saleClosingDate'],
      });
    }
    if (data.tokenContractAddress && !data.tokenContractChainId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Blockchain is required when token contract is specified',
        path: ['tokenContractChainId'],
      });
    }
    if (data.availableTokenQuantity > data.initialTokenQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Available quantity cannot exceed initial quantity',
        path: ['availableTokenQuantity'],
      });
    }
    if (data.minimumTokenBuyPerUser > data.availableTokenQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum buy per user cannot exceed available quantity',
        path: ['minimumTokenBuyPerUser'],
      });
    }
    if (
      data.maximumTokenBuyPerUser &&
      data.maximumTokenBuyPerUser > data.minimumTokenBuyPerUser
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum buy per user cannot exceed minimum buy per user',
        path: ['maximumTokenBuyPerUser'],
      });
    }
  });

export type InputProps<T extends string> = {
  [key in T]: Omit<FormInputProps, 'name'> & {
    optionKey?: string;
  };
};

export const InputProps = {
  name: { type: 'text' },
  tokenName: { type: 'text' },
  tokenSymbol: { type: 'text' },
  tokenContractAddress: { type: 'text' },
  tokenContractChainId: { type: 'select', optionKey: 'blockchain' },
  tokenPricePerUnit: {
    type: 'number',
    inputProps: {
      inputMode: 'decimal',
      autoComplete: 'off',
      step: '0.001',
      min: 0.001,
    },
  },
  currency: {
    type: 'select',
    optionKey: 'fiatCurrencies',
  },
  toWalletsAddress: { type: 'text' },
  saleStartDate: {
    type: 'date',
    inputProps: {
      disabled: (date) => date < new Date(new Date().setHours(0, 0, 0, 0)),
    },
  },
  saleClosingDate: {
    type: 'date',
    inputProps: { disabled: (date) => date < new Date() },
  },
  initialTokenQuantity: {
    type: 'number',
    inputProps: { inputMode: 'decimal', autoComplete: 'off' },
  },
  availableTokenQuantity: {
    type: 'number',
    inputProps: { inputMode: 'decimal', autoComplete: 'off' },
  },
  minimumTokenBuyPerUser: {
    type: 'number',
    inputProps: { inputMode: 'decimal', autoComplete: 'off' },
  },
  maximumTokenBuyPerUser: {
    type: 'number',
    inputProps: { inputMode: 'decimal', autoComplete: 'off' },
  },
  saftCheckbox: { type: 'checkbox' },
} as InputProps<keyof typeof formSchemaShape>;

export const saleInformationSchema = {
  summary: z.string().min(1, 'Summary is required'),
  tokenUtility: z.string().min(1, 'Token utility is required'),
  tokenDistribution: z.string().min(1, 'Token distribution is required'),
  futurePlans: z.string().min(1, 'Roadmap is required'),
  contactEmail: z.string().email('Invalid email address'),
  imageSale: z
    .instanceof(File, { message: 'Sale image is required' })
    .refine((file) => file.type.startsWith('image/'), 'File must be an image'),
  imageToken: z
    .instanceof(File, { message: 'Token image is required' })
    .refine((file) => file.type.startsWith('image/'), 'File must be an image'),
} as const;

export const saleInformationInputProps = {
  summary: {
    type: 'textarea',
    inputProps: {
      size: 'small' as const,
      multiline: true,
      rows: 1,
    },
  },
  tokenUtility: {
    type: 'textarea',
    inputProps: {
      size: 'small' as const,
      multiline: true,
      rows: 1,
    },
  },
  tokenDistribution: {
    type: 'textarea',
    inputProps: {
      placeholder: 'Smat Public Sale',
      size: 'small' as const,
      multiline: true,
      rows: 1,
    },
  },
  futurePlans: {
    type: 'textarea',
    inputProps: {
      placeholder: 'Smat Public Sale',
      size: 'small' as const,
      multiline: true,
      rows: 1,
    },
  },
  contactEmail: {
    type: 'email',
    inputProps: {},
  },
  imageSale: {
    type: 'file',
    inputProps: {
      accept: ['image/*'],
    },
  },
  imageToken: {
    type: 'file',
    inputProps: {
      accept: ['image/*'],
    },
  },
} as InputProps<keyof typeof saleInformationSchema>;

export const getSteps = (_t: ReturnType<typeof useTranslations>) => [
  { id: 1, name: 'Create', description: 'Basic information' },
  { id: 2, name: 'Contract', description: 'Contract details' },
  { id: 3, name: 'Additional Information', description: 'Final details' },
];

const DiscriminatedUnion = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('textarea'),
    value: z.string(),
    label: z.string(),
  }),
  z.object({
    type: z.literal('text'),
    value: z.string(),
    label: z.string(),
  }),
  z.object({
    type: z.literal('file'),
    value: z.instanceof(File),
    label: z.string(),
  }),
]);
export const InformationSchema = z.object({
  information: z.array(DiscriminatedUnion),
});

export const SaftSchema = z.object({
  content: z.custom<JSONContent>(),
  name: z.string().default(''),
  description: z.string().default(''),
});

export const SaleSchemas = {
  1: SaleFormSchema,
  2: SaftSchema,
  3: InformationSchema,
} as const;

export type FileType = Extract<
  z.infer<typeof DiscriminatedUnion>,
  { type: 'file' }
>;
