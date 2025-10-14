/*
  Warnings:

  - A unique constraint covering the columns `[approverId]` on the table `saft_contract` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "email_verification" ALTER COLUMN "expiredAt" SET DEFAULT NOW() + interval '3 hour';

-- AlterTable
ALTER TABLE "saft_contract" ADD COLUMN     "approverId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "saft_contract_approverId_key" ON "saft_contract"("approverId");

-- AddForeignKey
ALTER TABLE "saft_contract" ADD CONSTRAINT "saft_contract_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "signable_document_recipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
