-- CreateEnum
CREATE TYPE "public"."signable_document_role" AS ENUM ('CC', 'SIGNER', 'VIEWER', 'APPROVER');

-- CreateEnum
CREATE TYPE "public"."document_signature_status" AS ENUM ('CREATED', 'SENT_FOR_SIGNATURE', 'WAITING_FOR_COUNTERPARTY', 'SIGNED', 'EXPIRED', 'REJECTED', 'OPENED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."RegistrationStep" AS ENUM ('REGISTRATION_NEW_ACCOUNT', 'REGISTRATION_PERSONAL_DETAIL', 'REGISTRATION_DOCUMENT_DETAIL', 'REGISTRATION_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."FOP" AS ENUM ('CRYPTO', 'TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "public"."SaleStatus" AS ENUM ('CREATED', 'OPEN', 'CLOSED', 'FINISHED');

-- CreateEnum
CREATE TYPE "public"."CurrencyType" AS ENUM ('CRYPTO', 'FIAT');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'REJECTED', 'CANCELLED', 'TOKENS_DISTRIBUTED', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."ContractSignatureStatus" AS ENUM ('PENDING', 'SIGNED');

-- CreateEnum
CREATE TYPE "public"."EmailVerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'NOTVERIFIED');

-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "isSiwe" BOOLEAN,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_verification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + interval '3 hour',
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "firstName" TEXT,
    "lastName" TEXT,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."address" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "state" TEXT,
    "street" TEXT,
    "formattedAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "catchPhrase" TEXT,
    "bannerId" TEXT,
    "status" "public"."SaleStatus" NOT NULL DEFAULT 'CREATED',
    "currency" TEXT NOT NULL,
    "initialTokenQuantity" INTEGER NOT NULL,
    "availableTokenQuantity" INTEGER NOT NULL,
    "maximumTokenBuyPerUser" INTEGER,
    "minimumTokenBuyPerUser" INTEGER NOT NULL DEFAULT 1,
    "saleStartDate" TIMESTAMP(3) NOT NULL,
    "tokenContractAddress" TEXT,
    "tokenContractChainId" INTEGER,
    "tokenId" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenTotalSupply" TEXT,
    "tokenPricePerUnit" DECIMAL(36,18) NOT NULL,
    "comparisonPricePerUnit" DECIMAL(36,18),
    "toWalletsAddress" TEXT NOT NULL,
    "saleClosingDate" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "saftCheckbox" BOOLEAN NOT NULL DEFAULT false,
    "requiresKYC" BOOLEAN NOT NULL DEFAULT false,
    "information" JSONB,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."saft_contract" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "content" JSONB,
    "variables" JSONB[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "saleId" TEXT,

    CONSTRAINT "saft_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."signable_document_recipient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "fullname" TEXT,
    "email" TEXT NOT NULL,
    "role" "public"."signable_document_role" NOT NULL DEFAULT 'SIGNER',
    "status" "public"."document_signature_status" NOT NULL DEFAULT 'CREATED',
    "signatureUrl" TEXT,
    "externalId" INTEGER,
    "storageKey" TEXT,
    "address" TEXT,
    "saftContractId" TEXT,

    CONSTRAINT "signable_document_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "saleId" TEXT,
    "kycVerificationId" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vesting_schedules" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "saleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cliffPeriod" INTEGER NOT NULL,
    "vestingPeriod" INTEGER NOT NULL,
    "releaseFrequency" INTEGER NOT NULL,
    "initialRelease" DOUBLE PRECISION NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vesting_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."token_distributions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "transactionId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "token_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_transactions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "tokenSymbol" TEXT NOT NULL,
    "quantity" DECIMAL(36,18) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "totalAmount" DECIMAL(36,18) NOT NULL,
    "totalAmountCurrency" TEXT NOT NULL,
    "formOfPayment" "public"."FOP" NOT NULL,
    "receivingWallet" TEXT,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "comment" TEXT,
    "amountPaid" TEXT,
    "paidCurrency" TEXT NOT NULL,
    "txHash" TEXT,
    "blockchainId" TEXT,
    "agreementId" TEXT,
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "paymentEvidenceId" TEXT,
    "paymentDate" TIMESTAMP(3),

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blockchain" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "explorerUrl" TEXT,
    "isTestnet" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "blockchain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_status" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "userId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" "public"."ContractSignatureStatus" NOT NULL,

    CONSTRAINT "contract_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_trails" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "transactionId" TEXT,
    "actionType" TEXT NOT NULL,
    "performerAddress" TEXT NOT NULL,
    "content" JSONB,
    "comment" TEXT,

    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kyc_verifications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "userId" TEXT NOT NULL,
    "status" "public"."KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_details" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "bankName" TEXT NOT NULL,
    "accountName" TEXT,
    "iban" TEXT NOT NULL,
    "swift" TEXT,
    "address" TEXT,
    "memo" TEXT,
    "currencyId" TEXT,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "public"."tokens" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "symbol" TEXT NOT NULL,
    "totalSupply" TEXT,
    "image" TEXT,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tokens_on_blockchains" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isNative" BOOLEAN NOT NULL DEFAULT false,
    "decimals" INTEGER NOT NULL,
    "contractAddress" TEXT,

    CONSTRAINT "tokens_on_blockchains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currencies" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" "public"."CurrencyType" NOT NULL,
    "image" TEXT,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchange_rates" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(36,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_BankDetailsToSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BankDetailsToSale_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "public"."users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_userId_key" ON "public"."email_verification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_userId_key" ON "public"."session"("token", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "public"."profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "address_userId_key" ON "public"."address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_bannerId_key" ON "public"."sales"("bannerId");

-- CreateIndex
CREATE UNIQUE INDEX "saft_contract_saleId_key" ON "public"."saft_contract"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "saft_contract_parentId_version_key" ON "public"."saft_contract"("parentId", "version");

-- CreateIndex
CREATE INDEX "signable_document_recipient_email_idx" ON "public"."signable_document_recipient"("email");

-- CreateIndex
CREATE INDEX "signable_document_recipient_address_saftContractId_idx" ON "public"."signable_document_recipient"("address", "saftContractId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_id_url_key" ON "public"."documents"("id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_agreementId_key" ON "public"."sales_transactions"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_paymentEvidenceId_key" ON "public"."sales_transactions"("paymentEvidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_chainId_key" ON "public"."blockchain"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_id_chainId_key" ON "public"."blockchain"("id", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_status_userId_contractId_key" ON "public"."contract_status"("userId", "contractId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_verifications_userId_key" ON "public"."kyc_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_id_symbol_key" ON "public"."tokens"("id", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_on_blockchains_tokenId_chainId_key" ON "public"."tokens_on_blockchains"("tokenId", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_on_blockchains_tokenSymbol_chainId_key" ON "public"."tokens_on_blockchains"("tokenSymbol", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_symbol_key" ON "public"."currencies"("symbol");

-- CreateIndex
CREATE INDEX "_BankDetailsToSale_B_index" ON "public"."_BankDetailsToSale"("B");

-- AddForeignKey
ALTER TABLE "public"."email_verification" ADD CONSTRAINT "email_verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."address" ADD CONSTRAINT "address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_currency_fkey" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_tokenContractChainId_fkey" FOREIGN KEY ("tokenContractChainId") REFERENCES "public"."blockchain"("chainId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_tokenId_tokenSymbol_fkey" FOREIGN KEY ("tokenId", "tokenSymbol") REFERENCES "public"."tokens"("id", "symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saft_contract" ADD CONSTRAINT "saft_contract_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."signable_document_recipient" ADD CONSTRAINT "signable_document_recipient_address_fkey" FOREIGN KEY ("address") REFERENCES "public"."users"("walletAddress") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."signable_document_recipient" ADD CONSTRAINT "signable_document_recipient_saftContractId_fkey" FOREIGN KEY ("saftContractId") REFERENCES "public"."saft_contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_kycVerificationId_fkey" FOREIGN KEY ("kycVerificationId") REFERENCES "public"."kyc_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vesting_schedules" ADD CONSTRAINT "vesting_schedules_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."token_distributions" ADD CONSTRAINT "token_distributions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."sales_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_paidCurrency_fkey" FOREIGN KEY ("paidCurrency") REFERENCES "public"."currencies"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_blockchainId_fkey" FOREIGN KEY ("blockchainId") REFERENCES "public"."blockchain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "public"."signable_document_recipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_paymentEvidenceId_fkey" FOREIGN KEY ("paymentEvidenceId") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_trails" ADD CONSTRAINT "audit_trails_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."sales_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_trails" ADD CONSTRAINT "audit_trails_performerAddress_fkey" FOREIGN KEY ("performerAddress") REFERENCES "public"."users"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_details" ADD CONSTRAINT "bank_details_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tokens_on_blockchains" ADD CONSTRAINT "tokens_on_blockchains_tokenId_tokenSymbol_fkey" FOREIGN KEY ("tokenId", "tokenSymbol") REFERENCES "public"."tokens"("id", "symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tokens_on_blockchains" ADD CONSTRAINT "tokens_on_blockchains_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "public"."blockchain"("chainId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_fromCurrency_fkey" FOREIGN KEY ("fromCurrency") REFERENCES "public"."currencies"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_toCurrency_fkey" FOREIGN KEY ("toCurrency") REFERENCES "public"."currencies"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BankDetailsToSale" ADD CONSTRAINT "_BankDetailsToSale_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."bank_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BankDetailsToSale" ADD CONSTRAINT "_BankDetailsToSale_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
