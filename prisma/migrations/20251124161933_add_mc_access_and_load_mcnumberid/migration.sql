/*
  Warnings:

  - You are about to drop the column `mcNumber` on the `Load` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountingSyncStatus" AS ENUM ('NOT_SYNCED', 'PENDING_SYNC', 'SYNCED', 'SYNC_FAILED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('SIP', 'SMS', 'TELEGRAM', 'EMAIL', 'MOBILE_APP');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('CALL', 'SMS', 'MMS', 'TELEGRAM', 'EMAIL', 'VOICEMAIL', 'NOTE', 'MESSAGE', 'BREAKDOWN_REPORT');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "LoadExpenseType" AS ENUM ('TOLL', 'SCALE', 'SCALE_TICKET', 'PERMIT', 'LUMPER', 'DETENTION', 'PARKING', 'REPAIR', 'TOWING', 'TIRE', 'FUEL_ADDITIVE', 'DEF', 'WASH', 'MEAL', 'LODGING', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('FIXED', 'PERCENTAGE', 'PER_MILE');

-- CreateEnum
CREATE TYPE "DeductionFrequency" AS ENUM ('PER_SETTLEMENT', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "IFTAPeriodType" AS ENUM ('QUARTER', 'MONTH');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('INVOICE', 'FUEL', 'BREAKDOWN', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL');

-- CreateEnum
CREATE TYPE "CustomFieldEntityType" AS ENUM ('LOAD', 'DRIVER', 'CUSTOMER', 'TRUCK', 'TRAILER', 'INVOICE');

-- CreateEnum
CREATE TYPE "AISuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeductionType" ADD VALUE 'CASH_ADVANCE';
ALTER TYPE "DeductionType" ADD VALUE 'OCCUPATIONAL_ACCIDENT';
ALTER TYPE "DeductionType" ADD VALUE 'TRUCK_PAYMENT';
ALTER TYPE "DeductionType" ADD VALUE 'TRUCK_LEASE';
ALTER TYPE "DeductionType" ADD VALUE 'ESCROW';
ALTER TYPE "DeductionType" ADD VALUE 'FUEL_CARD_FEE';
ALTER TYPE "DeductionType" ADD VALUE 'TRAILER_RENTAL';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_mcNumberId_fkey";

-- AlterTable
ALTER TABLE "Breakdown" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "FuelEntry" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "Load" DROP COLUMN "mcNumber",
ADD COLUMN     "accountingSyncStatus" "AccountingSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
ADD COLUMN     "accountingSyncedAt" TIMESTAMP(3),
ADD COLUMN     "mcNumberId" TEXT,
ADD COLUMN     "netProfit" DOUBLE PRECISION,
ADD COLUMN     "podUploadedAt" TIMESTAMP(3),
ADD COLUMN     "readyForSettlement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "breakdownId" TEXT,
ADD COLUMN     "documentIds" TEXT[],
ADD COLUMN     "fuelEntryId" TEXT,
ADD COLUMN     "hasInvoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasReceipt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "mcNumberId" TEXT,
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "type" "PaymentType" NOT NULL DEFAULT 'INVOICE',
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Settlement" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "calculatedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "SettlementDeduction" ADD COLUMN     "driverAdvanceId" TEXT,
ADD COLUMN     "loadExpenseId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mcAccess" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "LoadSegment" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "startLocation" TEXT,
    "endLocation" TEXT,
    "startCity" TEXT,
    "startState" TEXT,
    "endCity" TEXT,
    "endState" TEXT,
    "startMiles" DOUBLE PRECISION,
    "endMiles" DOUBLE PRECISION,
    "segmentMiles" DOUBLE PRECISION NOT NULL,
    "loadedMiles" DOUBLE PRECISION DEFAULT 0,
    "emptyMiles" DOUBLE PRECISION DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "isAutoCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "breakdownId" TEXT,
    "driverId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "telegramId" TEXT,
    "telegramChatId" TEXT,
    "emailAddress" TEXT,
    "content" TEXT,
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "mediaUrls" TEXT[],
    "location" JSONB,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "autoCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "externalId" TEXT,
    "providerMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAdvance" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "loadId" TEXT,
    "settlementId" TEXT,
    "deductedAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadExpense" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "expenseType" "LoadExpenseType" NOT NULL,
    "category" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "settlementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deductionType" "DeductionType" NOT NULL,
    "driverType" "DriverType",
    "calculationType" "CalculationType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "perMileRate" DOUBLE PRECISION,
    "frequency" "DeductionFrequency" NOT NULL DEFAULT 'PER_SETTLEMENT',
    "minGrossPay" DOUBLE PRECISION,
    "maxAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementApproval" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "approvedById" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFTAConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stateRates" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IFTAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFTAEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT,
    "periodType" "IFTAPeriodType" NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodQuarter" INTEGER,
    "periodMonth" INTEGER,
    "totalMiles" DOUBLE PRECISION NOT NULL,
    "totalTax" DOUBLE PRECISION NOT NULL,
    "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IFTAEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IFTAStateMileage" (
    "id" TEXT NOT NULL,
    "iftaEntryId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "miles" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IFTAStateMileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "generalSettings" JSONB,
    "notificationSettings" JSONB,
    "appearanceSettings" JSONB,
    "securitySettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "entityType" "CustomFieldEntityType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "options" JSONB,
    "placeholder" TEXT,
    "helpText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "aiConfidence" DOUBLE PRECISION NOT NULL,
    "aiReasoning" TEXT NOT NULL,
    "suggestedValue" JSONB NOT NULL,
    "originalValue" JSONB,
    "status" "AISuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approved" BOOLEAN,
    "rejectionReason" TEXT,
    "appliedAt" TIMESTAMP(3),
    "appliedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoadSegment_loadId_idx" ON "LoadSegment"("loadId");

-- CreateIndex
CREATE INDEX "LoadSegment_driverId_idx" ON "LoadSegment"("driverId");

-- CreateIndex
CREATE INDEX "LoadSegment_truckId_idx" ON "LoadSegment"("truckId");

-- CreateIndex
CREATE INDEX "LoadSegment_loadId_sequence_idx" ON "LoadSegment"("loadId", "sequence");

-- CreateIndex
CREATE INDEX "LoadSegment_startDate_idx" ON "LoadSegment"("startDate");

-- CreateIndex
CREATE INDEX "Communication_companyId_idx" ON "Communication"("companyId");

-- CreateIndex
CREATE INDEX "Communication_breakdownId_idx" ON "Communication"("breakdownId");

-- CreateIndex
CREATE INDEX "Communication_driverId_idx" ON "Communication"("driverId");

-- CreateIndex
CREATE INDEX "Communication_channel_idx" ON "Communication"("channel");

-- CreateIndex
CREATE INDEX "Communication_type_idx" ON "Communication"("type");

-- CreateIndex
CREATE INDEX "Communication_direction_idx" ON "Communication"("direction");

-- CreateIndex
CREATE INDEX "Communication_createdAt_idx" ON "Communication"("createdAt");

-- CreateIndex
CREATE INDEX "Communication_telegramChatId_idx" ON "Communication"("telegramChatId");

-- CreateIndex
CREATE INDEX "DriverAdvance_driverId_idx" ON "DriverAdvance"("driverId");

-- CreateIndex
CREATE INDEX "DriverAdvance_loadId_idx" ON "DriverAdvance"("loadId");

-- CreateIndex
CREATE INDEX "DriverAdvance_settlementId_idx" ON "DriverAdvance"("settlementId");

-- CreateIndex
CREATE INDEX "DriverAdvance_approvalStatus_idx" ON "DriverAdvance"("approvalStatus");

-- CreateIndex
CREATE INDEX "DriverAdvance_approvedById_idx" ON "DriverAdvance"("approvedById");

-- CreateIndex
CREATE INDEX "DriverAdvance_requestDate_idx" ON "DriverAdvance"("requestDate");

-- CreateIndex
CREATE INDEX "LoadExpense_loadId_idx" ON "LoadExpense"("loadId");

-- CreateIndex
CREATE INDEX "LoadExpense_expenseType_idx" ON "LoadExpense"("expenseType");

-- CreateIndex
CREATE INDEX "LoadExpense_settlementId_idx" ON "LoadExpense"("settlementId");

-- CreateIndex
CREATE INDEX "LoadExpense_approvalStatus_idx" ON "LoadExpense"("approvalStatus");

-- CreateIndex
CREATE INDEX "LoadExpense_approvedById_idx" ON "LoadExpense"("approvedById");

-- CreateIndex
CREATE INDEX "LoadExpense_date_idx" ON "LoadExpense"("date");

-- CreateIndex
CREATE INDEX "DeductionRule_companyId_idx" ON "DeductionRule"("companyId");

-- CreateIndex
CREATE INDEX "DeductionRule_deductionType_idx" ON "DeductionRule"("deductionType");

-- CreateIndex
CREATE INDEX "DeductionRule_driverType_idx" ON "DeductionRule"("driverType");

-- CreateIndex
CREATE INDEX "DeductionRule_isActive_idx" ON "DeductionRule"("isActive");

-- CreateIndex
CREATE INDEX "SettlementApproval_settlementId_idx" ON "SettlementApproval"("settlementId");

-- CreateIndex
CREATE INDEX "SettlementApproval_approvedById_idx" ON "SettlementApproval"("approvedById");

-- CreateIndex
CREATE INDEX "SettlementApproval_status_idx" ON "SettlementApproval"("status");

-- CreateIndex
CREATE INDEX "SettlementApproval_createdAt_idx" ON "SettlementApproval"("createdAt");

-- CreateIndex
CREATE INDEX "IFTAConfig_companyId_idx" ON "IFTAConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IFTAConfig_companyId_key" ON "IFTAConfig"("companyId");

-- CreateIndex
CREATE INDEX "IFTAEntry_companyId_idx" ON "IFTAEntry"("companyId");

-- CreateIndex
CREATE INDEX "IFTAEntry_driverId_idx" ON "IFTAEntry"("driverId");

-- CreateIndex
CREATE INDEX "IFTAEntry_truckId_idx" ON "IFTAEntry"("truckId");

-- CreateIndex
CREATE INDEX "IFTAEntry_loadId_idx" ON "IFTAEntry"("loadId");

-- CreateIndex
CREATE INDEX "IFTAEntry_periodYear_periodQuarter_periodMonth_idx" ON "IFTAEntry"("periodYear", "periodQuarter", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "IFTAEntry_loadId_key" ON "IFTAEntry"("loadId");

-- CreateIndex
CREATE INDEX "IFTAStateMileage_iftaEntryId_idx" ON "IFTAStateMileage"("iftaEntryId");

-- CreateIndex
CREATE INDEX "IFTAStateMileage_state_idx" ON "IFTAStateMileage"("state");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "CompanySettings_companyId_idx" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "CustomField_companyId_idx" ON "CustomField"("companyId");

-- CreateIndex
CREATE INDEX "CustomField_entityType_idx" ON "CustomField"("entityType");

-- CreateIndex
CREATE INDEX "CustomField_isActive_idx" ON "CustomField"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_companyId_name_entityType_key" ON "CustomField"("companyId", "name", "entityType");

-- CreateIndex
CREATE INDEX "AISuggestion_companyId_idx" ON "AISuggestion"("companyId");

-- CreateIndex
CREATE INDEX "AISuggestion_status_idx" ON "AISuggestion"("status");

-- CreateIndex
CREATE INDEX "AISuggestion_suggestionType_idx" ON "AISuggestion"("suggestionType");

-- CreateIndex
CREATE INDEX "AISuggestion_entityType_entityId_idx" ON "AISuggestion"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AISuggestion_reviewedById_idx" ON "AISuggestion"("reviewedById");

-- CreateIndex
CREATE INDEX "AISuggestion_appliedById_idx" ON "AISuggestion"("appliedById");

-- CreateIndex
CREATE INDEX "ApiCache_cacheKey_idx" ON "ApiCache"("cacheKey");

-- CreateIndex
CREATE INDEX "Breakdown_mcNumberId_idx" ON "Breakdown"("mcNumberId");

-- CreateIndex
CREATE INDEX "Customer_mcNumber_idx" ON "Customer"("mcNumber");

-- CreateIndex
CREATE INDEX "Customer_companyId_mcNumber_idx" ON "Customer"("companyId", "mcNumber");

-- CreateIndex
CREATE INDEX "FuelEntry_mcNumberId_idx" ON "FuelEntry"("mcNumberId");

-- CreateIndex
CREATE INDEX "Load_mcNumberId_idx" ON "Load"("mcNumberId");

-- CreateIndex
CREATE INDEX "Load_companyId_mcNumberId_idx" ON "Load"("companyId", "mcNumberId");

-- CreateIndex
CREATE INDEX "Payment_fuelEntryId_idx" ON "Payment"("fuelEntryId");

-- CreateIndex
CREATE INDEX "Payment_breakdownId_idx" ON "Payment"("breakdownId");

-- CreateIndex
CREATE INDEX "Payment_mcNumberId_idx" ON "Payment"("mcNumberId");

-- CreateIndex
CREATE INDEX "Payment_type_idx" ON "Payment"("type");

-- CreateIndex
CREATE INDEX "Settlement_approvalStatus_idx" ON "Settlement"("approvalStatus");

-- CreateIndex
CREATE INDEX "Settlement_approvedById_idx" ON "Settlement"("approvedById");

-- CreateIndex
CREATE INDEX "SettlementDeduction_driverAdvanceId_idx" ON "SettlementDeduction"("driverAdvanceId");

-- CreateIndex
CREATE INDEX "SettlementDeduction_loadExpenseId_idx" ON "SettlementDeduction"("loadExpenseId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSegment" ADD CONSTRAINT "LoadSegment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSegment" ADD CONSTRAINT "LoadSegment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSegment" ADD CONSTRAINT "LoadSegment_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_driverAdvanceId_fkey" FOREIGN KEY ("driverAdvanceId") REFERENCES "DriverAdvance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_loadExpenseId_fkey" FOREIGN KEY ("loadExpenseId") REFERENCES "LoadExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAdvance" ADD CONSTRAINT "DriverAdvance_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionRule" ADD CONSTRAINT "DeductionRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementApproval" ADD CONSTRAINT "SettlementApproval_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementApproval" ADD CONSTRAINT "SettlementApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAConfig" ADD CONSTRAINT "IFTAConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAEntry" ADD CONSTRAINT "IFTAEntry_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IFTAStateMileage" ADD CONSTRAINT "IFTAStateMileage_iftaEntryId_fkey" FOREIGN KEY ("iftaEntryId") REFERENCES "IFTAEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_fuelEntryId_fkey" FOREIGN KEY ("fuelEntryId") REFERENCES "FuelEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
