import { KycTierType } from '@/common/schemas/generated';
import { TransactionByIdWithRelations } from '@/common/types/transactions';

export type GetTransactionByIdRes = {
  transaction: TransactionByIdWithRelations;
  requiresKYC: (KycTierType | 'BLOCKED') | null;
  requiresSAFT: boolean;
  explorerUrl: string | null;
}
