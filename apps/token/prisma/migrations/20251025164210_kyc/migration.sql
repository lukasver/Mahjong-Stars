-- CreateEnum
CREATE TYPE "KycTier" AS ENUM ('SIMPLIFIED', 'STANDARD', 'ENHANCED');

-- AlterTable
ALTER TABLE "email_verification" ALTER COLUMN "expiredAt" SET DEFAULT NOW() + interval '3 hour';

-- AlterTable
ALTER TABLE "kyc_verifications" ADD COLUMN     "questionnaire" JSONB,
ADD COLUMN     "tier" "KycTier" DEFAULT 'SIMPLIFIED',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "saft_contract" ALTER COLUMN "version" SET DEFAULT 0;
