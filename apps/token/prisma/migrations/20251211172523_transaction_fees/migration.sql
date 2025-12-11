-- CreateEnum
CREATE TYPE "TransactionFeeType" AS ENUM ('PROCESSING', 'NETWORK', 'PLATFORM', 'PAYMENT_GATEWAY', 'EXCHANGE', 'THIRD_PARTY', 'REGULATORY', 'OTHER');

-- AlterTable
ALTER TABLE "email_verification" ALTER COLUMN "expiredAt" SET DEFAULT NOW() + interval '3 hour';

-- CreateTable
CREATE TABLE "transaction_fees" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "transactionId" TEXT NOT NULL,
    "type" "TransactionFeeType" NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,

    CONSTRAINT "transaction_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_fees_transactionId_idx" ON "transaction_fees"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_fees_type_idx" ON "transaction_fees"("type");

-- AddForeignKey
ALTER TABLE "transaction_fees" ADD CONSTRAINT "transaction_fees_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
