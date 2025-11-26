-- AlterTable
ALTER TABLE "email_verification" ALTER COLUMN "expiredAt" SET DEFAULT NOW() + interval '3 hour';

-- AlterTable
ALTER TABLE "sales_transactions" ADD COLUMN     "metadata" JSONB;
