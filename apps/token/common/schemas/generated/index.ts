import { z } from 'zod';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.function(z.tuple([]), z.string()),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','externalId','createdAt','updatedAt','deletedAt','name','walletAddress','email','emailVerified','image','isSiwe']);

export const EmailVerificationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','expiredAt','email','token','userId']);

export const SessionScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','expiresAt','token','ipAddress','userAgent','userId']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','expiresAt','identifier','value']);

export const ProfileScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','firstName','lastName','userId','phoneNumber','dateOfBirth']);

export const AddressScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','userId','city','zipCode','country','state','street','formattedAddress','latitude','longitude']);

export const SaleScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','name','catchPhrase','bannerId','status','currency','initialTokenQuantity','availableTokenQuantity','maximumTokenBuyPerUser','minimumTokenBuyPerUser','saleStartDate','tokenContractAddress','tokenContractChainId','tokenId','tokenName','tokenSymbol','tokenTotalSupply','tokenPricePerUnit','toWalletsAddress','saleClosingDate','createdBy','saftCheckbox','requiresKYC','information']);

export const SaftContractScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','name','description','url','content','variables','version','parentId','isCurrent','saleId']);

export const DocumentRecipientScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','fullname','email','role','status','signatureUrl','externalId','address','saftContractId']);

export const DocumentScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','name','fileName','url','type','userId','saleId','kycVerificationId']);

export const VestingScheduleScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','saleId','name','cliffPeriod','vestingPeriod','releaseFrequency','initialRelease','isEnabled']);

export const TokenDistributionScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','transactionId','amount','distributionDate','txHash','status']);

export const SaleTransactionsScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','tokenSymbol','quantity','rawPrice','price','totalAmount','formOfPayment','confirmationId','receivingWallet','status','userId','saleId','comment','amountPaid','paidCurrency','txHash','blockchainId','agreementId','approvedBy','rejectionReason','paymentEvidence','paymentDate']);

export const BlockchainScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','name','chainId','rpcUrl','explorerUrl','isTestnet','isEnabled']);

export const ContractStatusScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','userId','saleId','contractId','status']);

export const TransactionAuditScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','transactionId','actionType','fromStatus','toStatus','performedBy','comment']);

export const KycVerificationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','userId','status','verifiedAt','rejectionReason']);

export const RoleScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','name','description']);

export const UserRoleScalarFieldEnumSchema = z.enum(['createdAt','updatedAt','deletedAt','userId','roleId']);

export const TokenScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','symbol','totalSupply','image']);

export const TokensOnBlockchainsScalarFieldEnumSchema = z.enum(['id','tokenId','tokenSymbol','chainId','name','isNative','decimals','contractAddress']);

export const CurrencyScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','deletedAt','name','symbol','type']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const SignableDocumentRoleSchema = z.enum(['CC','SIGNER','VIEWER','APPROVER']);

export type SignableDocumentRoleType = `${z.infer<typeof SignableDocumentRoleSchema>}`

export const DocumentSignatureStatusSchema = z.enum(['CREATED','SENT_FOR_SIGNATURE','WAITING_FOR_COUNTERPARTY','SIGNED','EXPIRED','REJECTED','OPENED','ERROR']);

export type DocumentSignatureStatusType = `${z.infer<typeof DocumentSignatureStatusSchema>}`

export const RegistrationStepSchema = z.enum(['REGISTRATION_NEW_ACCOUNT','REGISTRATION_PERSONAL_DETAIL','REGISTRATION_DOCUMENT_DETAIL','REGISTRATION_COMPLETED']);

export type RegistrationStepType = `${z.infer<typeof RegistrationStepSchema>}`

export const FOPSchema = z.enum(['CRYPTO','TRANSFER','CARD']);

export type FOPType = `${z.infer<typeof FOPSchema>}`

export const SaleStatusSchema = z.enum(['CREATED','OPEN','CLOSED','FINISHED']);

export type SaleStatusType = `${z.infer<typeof SaleStatusSchema>}`

export const CurrencyTypeSchema = z.enum(['CRYPTO','FIAT']);

export type CurrencyTypeType = `${z.infer<typeof CurrencyTypeSchema>}`

export const TransactionStatusSchema = z.enum(['PENDING','AWAITING_PAYMENT','PAYMENT_SUBMITTED','PAYMENT_VERIFIED','REJECTED','CANCELLED','TOKENS_ALLOCATED','TOKENS_DISTRIBUTED','COMPLETED','REFUNDED']);

export type TransactionStatusType = `${z.infer<typeof TransactionStatusSchema>}`

export const ContractSignatureStatusSchema = z.enum(['PENDING','SIGNED']);

export type ContractSignatureStatusType = `${z.infer<typeof ContractSignatureStatusSchema>}`

export const EmailVerificationStatusSchema = z.enum(['VERIFIED','PENDING','NOTVERIFIED']);

export type EmailVerificationStatusType = `${z.infer<typeof EmailVerificationStatusSchema>}`

export const KycStatusSchema = z.enum(['NOT_STARTED','SUBMITTED','VERIFIED','REJECTED']);

export type KycStatusType = `${z.infer<typeof KycStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().cuid(),
  /**
   * externalId is used to link the user to an external system
   */
  externalId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  walletAddress: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  isSiwe: z.boolean().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// EMAIL VERIFICATION SCHEMA
/////////////////////////////////////////

export const EmailVerificationSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiredAt: z.coerce.date(),
  email: z.string(),
  token: z.string(),
  userId: z.string(),
})

export type EmailVerification = z.infer<typeof EmailVerificationSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  identifier: z.string(),
  value: z.string(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// PROFILE SCHEMA
/////////////////////////////////////////

export const ProfileSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  userId: z.string(),
  phoneNumber: z.string().nullable(),
  dateOfBirth: z.coerce.date().nullable(),
})

export type Profile = z.infer<typeof ProfileSchema>

/////////////////////////////////////////
// ADDRESS SCHEMA
/////////////////////////////////////////

export const AddressSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  userId: z.string(),
  city: z.string().nullable(),
  zipCode: z.string().nullable(),
  country: z.string().nullable(),
  state: z.string().nullable(),
  street: z.string().nullable(),
  formattedAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export type Address = z.infer<typeof AddressSchema>

/////////////////////////////////////////
// SALE SCHEMA
/////////////////////////////////////////

export const SaleSchema = z.object({
  status: SaleStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  catchPhrase: z.string().nullable(),
  bannerId: z.string().nullable(),
  currency: z.string(),
  initialTokenQuantity: z.number().int(),
  availableTokenQuantity: z.number().int(),
  maximumTokenBuyPerUser: z.number().int().nullable(),
  minimumTokenBuyPerUser: z.number().int(),
  saleStartDate: z.coerce.date(),
  tokenContractAddress: z.string().nullable(),
  tokenContractChainId: z.number().int().nullable(),
  tokenId: z.string(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenTotalSupply: z.string().nullable(),
  tokenPricePerUnit: z.instanceof(Prisma.Decimal, { message: "Field 'tokenPricePerUnit' must be a Decimal. Location: ['Models', 'Sale']"}),
  toWalletsAddress: z.string(),
  saleClosingDate: z.coerce.date(),
  createdBy: z.string(),
  saftCheckbox: z.boolean(),
  /**
   * Check to add if the sale requires upload of KYC documents
   */
  requiresKYC: z.boolean(),
  information: JsonValueSchema.nullable(),
})

export type Sale = z.infer<typeof SaleSchema>

/////////////////////////////////////////
// SAFT CONTRACT SCHEMA
/////////////////////////////////////////

/**
 * *
 * * SaftContract model with versioning support.
 * * - All versions are stored in this table.
 * * - parentId: null for the original (v1), set to original id for subsequent versions.
 * * - isLatest: true for the latest version, false for previous versions.
 * * - Sale points to the latest version only.
 */
export const SaftContractSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  /**
   * For File types
   */
  url: z.string().nullable(),
  /**
   * Text content for TEXT type
   */
  content: JsonValueSchema.nullable(),
  /**
   * Variables for TEXT type
   */
  variables: JsonValueSchema.array(),
  version: z.number().int(),
  parentId: z.string().nullable(),
  isCurrent: z.boolean(),
  saleId: z.string().nullable(),
})

export type SaftContract = z.infer<typeof SaftContractSchema>

/////////////////////////////////////////
// DOCUMENT RECIPIENT SCHEMA
/////////////////////////////////////////

export const DocumentRecipientSchema = z.object({
  role: SignableDocumentRoleSchema,
  status: DocumentSignatureStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  fullname: z.string().nullable(),
  email: z.string(),
  signatureUrl: z.string().nullable(),
  externalId: z.number().int().nullable(),
  address: z.string().nullable(),
  saftContractId: z.string().nullable(),
})

export type DocumentRecipient = z.infer<typeof DocumentRecipientSchema>

/////////////////////////////////////////
// DOCUMENT SCHEMA
/////////////////////////////////////////

export const DocumentSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  fileName: z.string(),
  url: z.string(),
  /**
   * MIME type of the file
   */
  type: z.string(),
  userId: z.string().nullable(),
  saleId: z.string().nullable(),
  kycVerificationId: z.string().nullable(),
})

export type Document = z.infer<typeof DocumentSchema>

/////////////////////////////////////////
// VESTING SCHEDULE SCHEMA
/////////////////////////////////////////

export const VestingScheduleSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  saleId: z.string(),
  name: z.string(),
  cliffPeriod: z.number().int(),
  vestingPeriod: z.number().int(),
  releaseFrequency: z.number().int(),
  initialRelease: z.number(),
  isEnabled: z.boolean(),
})

export type VestingSchedule = z.infer<typeof VestingScheduleSchema>

/////////////////////////////////////////
// TOKEN DISTRIBUTION SCHEMA
/////////////////////////////////////////

export const TokenDistributionSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  transactionId: z.string(),
  amount: z.string(),
  distributionDate: z.coerce.date(),
  txHash: z.string().nullable(),
  status: z.string(),
})

export type TokenDistribution = z.infer<typeof TokenDistributionSchema>

/////////////////////////////////////////
// SALE TRANSACTIONS SCHEMA
/////////////////////////////////////////

export const SaleTransactionsSchema = z.object({
  formOfPayment: FOPSchema,
  status: TransactionStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  tokenSymbol: z.string(),
  quantity: z.instanceof(Prisma.Decimal, { message: "Field 'quantity' must be a Decimal. Location: ['Models', 'SaleTransactions']"}),
  rawPrice: z.string(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'SaleTransactions']"}),
  totalAmount: z.instanceof(Prisma.Decimal, { message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'SaleTransactions']"}),
  confirmationId: z.string().nullable(),
  receivingWallet: z.string().nullable(),
  userId: z.string(),
  saleId: z.string(),
  comment: z.string().nullable(),
  amountPaid: z.string(),
  paidCurrency: z.string(),
  txHash: z.string().nullable(),
  blockchainId: z.string().nullable(),
  agreementId: z.string().nullable(),
  approvedBy: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  paymentEvidence: z.string().nullable(),
  paymentDate: z.coerce.date().nullable(),
})

export type SaleTransactions = z.infer<typeof SaleTransactionsSchema>

/////////////////////////////////////////
// BLOCKCHAIN SCHEMA
/////////////////////////////////////////

export const BlockchainSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  chainId: z.number().int(),
  rpcUrl: z.string(),
  explorerUrl: z.string().nullable(),
  isTestnet: z.boolean(),
  isEnabled: z.boolean(),
})

export type Blockchain = z.infer<typeof BlockchainSchema>

/////////////////////////////////////////
// CONTRACT STATUS SCHEMA
/////////////////////////////////////////

export const ContractStatusSchema = z.object({
  status: ContractSignatureStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  userId: z.string(),
  saleId: z.string(),
  contractId: z.string(),
})

export type ContractStatus = z.infer<typeof ContractStatusSchema>

/////////////////////////////////////////
// TRANSACTION AUDIT SCHEMA
/////////////////////////////////////////

export const TransactionAuditSchema = z.object({
  fromStatus: TransactionStatusSchema,
  toStatus: TransactionStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  transactionId: z.string(),
  actionType: z.string(),
  performedBy: z.string(),
  comment: z.string().nullable(),
})

export type TransactionAudit = z.infer<typeof TransactionAuditSchema>

/////////////////////////////////////////
// KYC VERIFICATION SCHEMA
/////////////////////////////////////////

export const KycVerificationSchema = z.object({
  status: KycStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  userId: z.string(),
  verifiedAt: z.coerce.date().nullable(),
  rejectionReason: z.string().nullable(),
})

export type KycVerification = z.infer<typeof KycVerificationSchema>

/////////////////////////////////////////
// ROLE SCHEMA
/////////////////////////////////////////

export const RoleSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  description: z.string().nullable(),
})

export type Role = z.infer<typeof RoleSchema>

/////////////////////////////////////////
// USER ROLE SCHEMA
/////////////////////////////////////////

export const UserRoleSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  userId: z.string(),
  roleId: z.string(),
})

export type UserRole = z.infer<typeof UserRoleSchema>

/////////////////////////////////////////
// TOKEN SCHEMA
/////////////////////////////////////////

export const TokenSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  symbol: z.string(),
  totalSupply: z.string().nullable(),
  image: z.string().nullable(),
})

export type Token = z.infer<typeof TokenSchema>

/////////////////////////////////////////
// TOKENS ON BLOCKCHAINS SCHEMA
/////////////////////////////////////////

export const TokensOnBlockchainsSchema = z.object({
  id: z.string().cuid(),
  tokenId: z.string(),
  tokenSymbol: z.string(),
  chainId: z.number().int(),
  name: z.string(),
  isNative: z.boolean(),
  decimals: z.number().int(),
  contractAddress: z.string().nullable(),
})

export type TokensOnBlockchains = z.infer<typeof TokensOnBlockchainsSchema>

/////////////////////////////////////////
// CURRENCY SCHEMA
/////////////////////////////////////////

export const CurrencySchema = z.object({
  type: CurrencyTypeSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  name: z.string(),
  symbol: z.string(),
})

export type Currency = z.infer<typeof CurrencySchema>
