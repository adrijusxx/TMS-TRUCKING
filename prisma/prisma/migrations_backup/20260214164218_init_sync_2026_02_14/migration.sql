/*
  Warnings:

  - The values [OIL_CHANGE,TIRE_ROTATION,BRAKE_SERVICE,INSPECTION,PMI,ENGINE,TRANSMISSION,OTHER] on the enum `MaintenanceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deletedAt` on the `AccessorialCharge` table. All the data in the column will be lost.
  - You are about to drop the column `changes` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `DeductionRule` table. All the data in the column will be lost.
  - The `frequency` column on the `DeductionRule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `driverTariff` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `legacyTags` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `perDiem` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `samsaraId` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `vendor` on the `LoadExpense` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `MaintenanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Settlement` table. All the data in the column will be lost.
  - The `manualModules` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `qbSynced` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `qbSyncedAt` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `qbVendorId` on the `Vendor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,ticketNumber]` on the table `Communication` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,companyId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[advanceNumber]` on the table `DriverAdvance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fuelEntryNumber]` on the table `FuelEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,inspectionNumber]` on the table `Inspection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,itemNumber]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,batchNumber]` on the table `InvoiceBatch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[expenseNumber]` on the table `LoadExpense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,locationNumber]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,maintenanceNumber]` on the table `MaintenanceRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,vin]` on the table `Trailer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,vin]` on the table `Truck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `isDriverChargeable` on table `Breakdown` required. This step will fail if there are existing NULL values in that column.
  - Made the column `aiAutoReply` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `fuelEntryNumber` to the `FuelEntry` table without a default value. This is not possible if the table is not empty.
  - Made the column `companyId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `MaintenanceRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SalaryBatchStatus" AS ENUM ('OPEN', 'POSTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DeductionRuleType" AS ENUM ('LEASE', 'INSURANCE', 'ELD');

-- CreateEnum
CREATE TYPE "DeductionRuleFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ApiKeyScope" AS ENUM ('GLOBAL', 'COMPANY', 'MC');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('FACEBOOK', 'REFERRAL', 'DIRECT', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CALL', 'SMS', 'EMAIL', 'NOTE', 'STATUS_CHANGE', 'DOCUMENT_UPLOAD', 'ASSIGNMENT_CHANGE');

-- CreateEnum
CREATE TYPE "SettlementValidationMode" AS ENUM ('STRICT', 'FLEXIBLE', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeductionType" ADD VALUE 'BONUS';
ALTER TYPE "DeductionType" ADD VALUE 'OVERTIME';
ALTER TYPE "DeductionType" ADD VALUE 'INCENTIVE';
ALTER TYPE "DeductionType" ADD VALUE 'REIMBURSEMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'DETENTION';
ALTER TYPE "DocumentType" ADD VALUE 'LUMPER';

-- AlterEnum
ALTER TYPE "LoadDispatchStatus" ADD VALUE 'NEEDS_DISPATCH';

-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceType_new" AS ENUM ('PM_A', 'PM_B', 'TIRES', 'REPAIR');
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "type" TYPE "MaintenanceType_new" USING ("type"::text::"MaintenanceType_new");
ALTER TABLE "MaintenanceSchedule" ALTER COLUMN "maintenanceType" TYPE "MaintenanceType_new" USING ("maintenanceType"::text::"MaintenanceType_new");
ALTER TYPE "MaintenanceType" RENAME TO "MaintenanceType_old";
ALTER TYPE "MaintenanceType_new" RENAME TO "MaintenanceType";
DROP TYPE "public"."MaintenanceType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PayType" ADD VALUE 'WEEKLY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'EFS';
ALTER TYPE "PaymentMethod" ADD VALUE 'COMDATA';
ALTER TYPE "PaymentMethod" ADD VALUE 'CASHAPP';
ALTER TYPE "PaymentMethod" ADD VALUE 'ZELLE';
ALTER TYPE "PaymentMethod" ADD VALUE 'VENMO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TruckStatus" ADD VALUE 'MAINTENANCE_DUE';
ALTER TYPE "TruckStatus" ADD VALUE 'NEEDS_REPAIR';

-- AlterEnum
ALTER TYPE "VendorType" ADD VALUE 'FACTORING';

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_mcNumberId_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoadExpense" DROP CONSTRAINT "LoadExpense_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationPreferences" DROP CONSTRAINT "NotificationPreferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "Trailer" DROP CONSTRAINT "Trailer_mcNumberId_fkey";

-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_mcNumberId_fkey";

-- DropIndex
DROP INDEX "AuditLog_entity_idx";

-- DropIndex
DROP INDEX "Breakdown_breakdownNumber_key";

-- DropIndex
DROP INDEX "Customer_customerNumber_key";

-- DropIndex
DROP INDEX "Customer_metadata_idx";

-- DropIndex
DROP INDEX "Driver_driverNumber_key";

-- DropIndex
DROP INDEX "Driver_metadata_idx";

-- DropIndex
DROP INDEX "Driver_userId_key";

-- DropIndex
DROP INDEX "DriverAdvance_approvalStatus_idx";

-- DropIndex
DROP INDEX "DriverAdvance_approvedById_idx";

-- DropIndex
DROP INDEX "DriverAdvance_requestDate_idx";

-- DropIndex
DROP INDEX "Inspection_inspectionNumber_key";

-- DropIndex
DROP INDEX "InventoryItem_itemNumber_key";

-- DropIndex
DROP INDEX "Invoice_invoiceNumber_key";

-- DropIndex
DROP INDEX "Invoice_metadata_idx";

-- DropIndex
DROP INDEX "InvoiceBatch_batchNumber_key";

-- DropIndex
DROP INDEX "Load_isBillingHold_idx";

-- DropIndex
DROP INDEX "Load_loadNumber_key";

-- DropIndex
DROP INDEX "Load_metadata_idx";

-- DropIndex
DROP INDEX "LoadStop_detentionClockStart_idx";

-- DropIndex
DROP INDEX "Location_locationNumber_key";

-- DropIndex
DROP INDEX "Payment_metadata_idx";

-- DropIndex
DROP INDEX "Settlement_metadata_idx";

-- DropIndex
DROP INDEX "Trailer_trailerNumber_key";

-- DropIndex
DROP INDEX "Trailer_vin_key";

-- DropIndex
DROP INDEX "Truck_metadata_idx";

-- DropIndex
DROP INDEX "Truck_truckNumber_key";

-- DropIndex
DROP INDEX "Truck_vin_key";

-- DropIndex
DROP INDEX "Vendor_vendorNumber_key";

-- AlterTable
ALTER TABLE "AccessorialCharge" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "changes",
DROP COLUMN "entity",
ADD COLUMN     "entityType" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "entityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Breakdown" ALTER COLUMN "isDriverChargeable" SET NOT NULL;

-- AlterTable
ALTER TABLE "Communication" ADD COLUMN     "telegramMessageId" INTEGER,
ADD COLUMN     "ticketNumber" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isTaxExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DeductionRule" DROP COLUMN "deletedAt",
ADD COLUMN     "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deductionFrequency" "DeductionFrequency" NOT NULL DEFAULT 'PER_SETTLEMENT',
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "goalAmount" DOUBLE PRECISION,
ADD COLUMN     "isAddition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "type" "DeductionRuleType",
DROP COLUMN "frequency",
ADD COLUMN     "frequency" "DeductionRuleFrequency";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "driverTariff",
DROP COLUMN "legacyTags",
DROP COLUMN "perDiem",
DROP COLUMN "samsaraId",
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "mcNumberId" DROP NOT NULL,
ALTER COLUMN "aiAutoReply" SET NOT NULL;

-- AlterTable
ALTER TABLE "DriverAdvance" ADD COLUMN     "advanceNumber" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "FactoringBatch" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "FuelEntry" ADD COLUMN     "fuelEntryNumber" TEXT NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "defectsFound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defectsList" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mechanicSignoff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Load" DROP COLUMN "notes",
ADD COLUMN     "actualMiles" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "LoadExpense" DROP COLUMN "vendor",
ADD COLUMN     "expenseNumber" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "LoadSegment" ADD COLUMN     "actualMiles" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MaintenanceRecord" DROP COLUMN "deletedAt",
ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "SafetyTraining" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Settlement" DROP COLUMN "deletedAt",
ADD COLUMN     "calculationLog" JSONB;

-- AlterTable
ALTER TABLE "SettlementDeduction" ADD COLUMN     "category" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "manualModules",
ADD COLUMN     "manualModules" "SubscriptionModule"[] DEFAULT ARRAY[]::"SubscriptionModule"[];

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "destinationZip" TEXT,
ADD COLUMN     "originZip" TEXT;

-- AlterTable
ALTER TABLE "Trailer" ALTER COLUMN "mcNumberId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Truck" ALTER COLUMN "mcNumberId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "voipConfig" JSONB;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "qbSynced",
DROP COLUMN "qbSyncedAt",
DROP COLUMN "qbVendorId",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialties" TEXT;

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "intervalMiles" INTEGER NOT NULL DEFAULT 0,
    "intervalMonths" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakdownAssignment" (
    "id" TEXT NOT NULL,
    "breakdownId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreakdownAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "status" "SalaryBatchStatus" NOT NULL DEFAULT 'OPEN',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settlementCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverNegativeBalance" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "originalSettlementId" TEXT,
    "appliedSettlementId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverNegativeBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionTypeTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionTypeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnomaly" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "defaultDetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "defaultFreeTimeMinutes" INTEGER NOT NULL DEFAULT 120,
    "standardTonuFee" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "factoringActive" BOOLEAN NOT NULL DEFAULT false,
    "factoringCompanyName" TEXT,
    "factoringCompanyAddress" TEXT,
    "payDriverOnFuelSurcharge" BOOLEAN NOT NULL DEFAULT false,
    "companyFuelTaxRate" DOUBLE PRECISION,
    "averageFuelPrice" DOUBLE PRECISION DEFAULT 3.65,
    "averageMpg" DOUBLE PRECISION DEFAULT 6.5,
    "maintenanceCpm" DOUBLE PRECISION DEFAULT 0.18,
    "fixedCostPerDay" DOUBLE PRECISION DEFAULT 85,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "googleServiceAccountEmail" TEXT,
    "googleServiceAccountPrivateKey" TEXT,
    "googleSheetsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserColumnPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "columnPreferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserColumnPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticCodeReference" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "spnId" INTEGER,
    "fmiId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "commonCauses" TEXT[],
    "troubleshooting" TEXT[],
    "estimatedCost" TEXT,
    "urgency" TEXT NOT NULL,
    "vehicleTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticCodeReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" TEXT NOT NULL,
    "sessionData" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastConnected" TIMESTAMP(3),
    "connectionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramDriverMapping" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "aiAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "phoneNumber" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TelegramDriverMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResponseLog" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT,
    "messageContent" TEXT NOT NULL,
    "aiAnalysis" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "wasAutoSent" BOOLEAN NOT NULL DEFAULT false,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "responseContent" TEXT,
    "actualResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIResponseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "autoCreateCases" BOOLEAN NOT NULL DEFAULT true,
    "aiAutoResponse" BOOLEAN NOT NULL DEFAULT false,
    "requireStaffApproval" BOOLEAN NOT NULL DEFAULT true,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "aiProvider" TEXT NOT NULL DEFAULT 'OPENAI',
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "emergencyKeywords" TEXT[] DEFAULT ARRAY['accident', 'injured', 'fire', 'police', 'emergency', 'crash', 'hurt']::TEXT[],
    "adminChatId" TEXT,
    "autoAckMessage" TEXT DEFAULT 'We received your message. Our team will respond shortly.',
    "caseCreatedMessage" TEXT DEFAULT 'Case #{caseNumber} created. We''ll contact you soon.',
    "afterHoursMessage" TEXT DEFAULT 'We received your message after hours. On-call staff will respond within 15 minutes.',
    "emergencyContactNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SamsaraSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "autoSyncDrivers" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncVehicles" BOOLEAN NOT NULL DEFAULT false,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SamsaraSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickBooksSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "qboEnvironment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "autoSyncInvoices" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncCustomers" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeyConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scope" "ApiKeyScope" NOT NULL DEFAULT 'GLOBAL',
    "companyId" TEXT,
    "mcNumberId" TEXT,
    "configKey" TEXT NOT NULL,
    "configValue" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKeyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmIntegration" (
    "id" TEXT NOT NULL,
    "mcNumberId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GOOGLE_SHEETS',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mcNumberId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "cdlNumber" TEXT,
    "cdlClass" TEXT,
    "cdlExpiration" TIMESTAMP(3),
    "endorsements" TEXT[],
    "yearsExperience" INTEGER,
    "previousEmployers" TEXT,
    "freightTypes" TEXT[],
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'WARM',
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "assignedToId" TEXT,
    "tags" TEXT[],
    "aiScore" DOUBLE PRECISION,
    "aiScoreSummary" TEXT,
    "aiScoreUpdatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDocument" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "settlementValidationMode" "SettlementValidationMode" NOT NULL DEFAULT 'FLEXIBLE',
    "requirePodUploaded" BOOLEAN NOT NULL DEFAULT false,
    "requireReadyForSettlementFlag" BOOLEAN NOT NULL DEFAULT false,
    "requireDeliveredDate" BOOLEAN NOT NULL DEFAULT true,
    "requireMcNumberMatch" BOOLEAN NOT NULL DEFAULT true,
    "warnOnMissingPod" BOOLEAN NOT NULL DEFAULT true,
    "warnOnMissingBol" BOOLEAN NOT NULL DEFAULT true,
    "warnOnOldDeliveryDate" BOOLEAN NOT NULL DEFAULT true,
    "oldDeliveryThresholdDays" INTEGER NOT NULL DEFAULT 30,
    "requirePodForInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "requireBolForInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "allowPartialBatches" BOOLEAN NOT NULL DEFAULT true,
    "autoMarkReadyForSettlement" BOOLEAN NOT NULL DEFAULT false,
    "autoMarkReadyForInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_truckId_idx" ON "MaintenanceSchedule"("truckId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_companyId_idx" ON "MaintenanceSchedule"("companyId");

-- CreateIndex
CREATE INDEX "BreakdownAssignment_breakdownId_idx" ON "BreakdownAssignment"("breakdownId");

-- CreateIndex
CREATE INDEX "BreakdownAssignment_userId_idx" ON "BreakdownAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BreakdownAssignment_breakdownId_userId_key" ON "BreakdownAssignment"("breakdownId", "userId");

-- CreateIndex
CREATE INDEX "SalaryBatch_companyId_idx" ON "SalaryBatch"("companyId");

-- CreateIndex
CREATE INDEX "SalaryBatch_status_idx" ON "SalaryBatch"("status");

-- CreateIndex
CREATE INDEX "SalaryBatch_periodStart_idx" ON "SalaryBatch"("periodStart");

-- CreateIndex
CREATE INDEX "SalaryBatch_periodEnd_idx" ON "SalaryBatch"("periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryBatch_companyId_batchNumber_key" ON "SalaryBatch"("companyId", "batchNumber");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_driverId_idx" ON "DriverNegativeBalance"("driverId");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_isApplied_idx" ON "DriverNegativeBalance"("isApplied");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_originalSettlementId_idx" ON "DriverNegativeBalance"("originalSettlementId");

-- CreateIndex
CREATE INDEX "DriverNegativeBalance_appliedSettlementId_idx" ON "DriverNegativeBalance"("appliedSettlementId");

-- CreateIndex
CREATE INDEX "DeductionTypeTemplate_companyId_idx" ON "DeductionTypeTemplate"("companyId");

-- CreateIndex
CREATE INDEX "DeductionTypeTemplate_category_idx" ON "DeductionTypeTemplate"("category");

-- CreateIndex
CREATE INDEX "DeductionTypeTemplate_isActive_idx" ON "DeductionTypeTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionTypeTemplate_companyId_name_key" ON "DeductionTypeTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "AIAnomaly_companyId_idx" ON "AIAnomaly"("companyId");

-- CreateIndex
CREATE INDEX "AIAnomaly_type_idx" ON "AIAnomaly"("type");

-- CreateIndex
CREATE INDEX "AIAnomaly_status_idx" ON "AIAnomaly"("status");

-- CreateIndex
CREATE INDEX "AIAnomaly_createdAt_idx" ON "AIAnomaly"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_companyId_key" ON "SystemConfig"("companyId");

-- CreateIndex
CREATE INDEX "SystemConfig_companyId_idx" ON "SystemConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSettings_companyId_key" ON "IntegrationSettings"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationSettings_companyId_idx" ON "IntegrationSettings"("companyId");

-- CreateIndex
CREATE INDEX "UserColumnPreference_userId_idx" ON "UserColumnPreference"("userId");

-- CreateIndex
CREATE INDEX "UserColumnPreference_entityType_idx" ON "UserColumnPreference"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "UserColumnPreference_userId_entityType_key" ON "UserColumnPreference"("userId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticCodeReference_code_key" ON "DiagnosticCodeReference"("code");

-- CreateIndex
CREATE INDEX "DiagnosticCodeReference_category_idx" ON "DiagnosticCodeReference"("category");

-- CreateIndex
CREATE INDEX "DiagnosticCodeReference_severity_idx" ON "DiagnosticCodeReference"("severity");

-- CreateIndex
CREATE INDEX "DiagnosticCodeReference_spnId_idx" ON "DiagnosticCodeReference"("spnId");

-- CreateIndex
CREATE INDEX "TelegramSession_isActive_idx" ON "TelegramSession"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramDriverMapping_driverId_key" ON "TelegramDriverMapping"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramDriverMapping_telegramId_key" ON "TelegramDriverMapping"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramDriverMapping_driverId_idx" ON "TelegramDriverMapping"("driverId");

-- CreateIndex
CREATE INDEX "TelegramDriverMapping_telegramId_idx" ON "TelegramDriverMapping"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramDriverMapping_phoneNumber_idx" ON "TelegramDriverMapping"("phoneNumber");

-- CreateIndex
CREATE INDEX "AIResponseLog_communicationId_idx" ON "AIResponseLog"("communicationId");

-- CreateIndex
CREATE INDEX "AIResponseLog_wasAutoSent_idx" ON "AIResponseLog"("wasAutoSent");

-- CreateIndex
CREATE INDEX "AIResponseLog_requiresReview_idx" ON "AIResponseLog"("requiresReview");

-- CreateIndex
CREATE INDEX "AIResponseLog_createdAt_idx" ON "AIResponseLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSettings_companyId_key" ON "TelegramSettings"("companyId");

-- CreateIndex
CREATE INDEX "TelegramSettings_companyId_idx" ON "TelegramSettings"("companyId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseDocument_companyId_idx" ON "KnowledgeBaseDocument"("companyId");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SamsaraSettings_companyId_key" ON "SamsaraSettings"("companyId");

-- CreateIndex
CREATE INDEX "SamsaraSettings_companyId_idx" ON "SamsaraSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksSettings_companyId_key" ON "QuickBooksSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksSettings_realmId_key" ON "QuickBooksSettings"("realmId");

-- CreateIndex
CREATE INDEX "QuickBooksSettings_companyId_idx" ON "QuickBooksSettings"("companyId");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_provider_idx" ON "ApiKeyConfig"("provider");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_scope_idx" ON "ApiKeyConfig"("scope");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_companyId_idx" ON "ApiKeyConfig"("companyId");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_mcNumberId_idx" ON "ApiKeyConfig"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeyConfig_provider_scope_companyId_mcNumberId_configKey_key" ON "ApiKeyConfig"("provider", "scope", "companyId", "mcNumberId", "configKey");

-- CreateIndex
CREATE INDEX "CrmIntegration_mcNumberId_idx" ON "CrmIntegration"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmIntegration_mcNumberId_type_key" ON "CrmIntegration"("mcNumberId", "type");

-- CreateIndex
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");

-- CreateIndex
CREATE INDEX "Lead_mcNumberId_idx" ON "Lead"("mcNumberId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_priority_idx" ON "Lead"("priority");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_companyId_mcNumberId_idx" ON "Lead"("companyId", "mcNumberId");

-- CreateIndex
CREATE INDEX "Lead_companyId_mcNumberId_status_idx" ON "Lead"("companyId", "mcNumberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_companyId_leadNumber_key" ON "Lead"("companyId", "leadNumber");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");

-- CreateIndex
CREATE INDEX "LeadNote_createdAt_idx" ON "LeadNote"("createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "LeadActivity"("type");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "LeadDocument_leadId_idx" ON "LeadDocument"("leadId");

-- CreateIndex
CREATE INDEX "LeadDocument_documentType_idx" ON "LeadDocument"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingSettings_companyId_key" ON "AccountingSettings"("companyId");

-- CreateIndex
CREATE INDEX "AccountingSettings_companyId_idx" ON "AccountingSettings"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "Communication_ticketNumber_idx" ON "Communication"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Communication_companyId_ticketNumber_key" ON "Communication"("companyId", "ticketNumber");

-- CreateIndex
CREATE INDEX "DeductionRule_driverId_idx" ON "DeductionRule"("driverId");

-- CreateIndex
CREATE INDEX "DeductionRule_isAddition_idx" ON "DeductionRule"("isAddition");

-- CreateIndex
CREATE INDEX "DeductionRule_startDate_idx" ON "DeductionRule"("startDate");

-- CreateIndex
CREATE INDEX "DeductionRule_endDate_idx" ON "DeductionRule"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_companyId_key" ON "Driver"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverAdvance_advanceNumber_key" ON "DriverAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "DriverAdvance_advanceNumber_idx" ON "DriverAdvance"("advanceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FuelEntry_fuelEntryNumber_key" ON "FuelEntry"("fuelEntryNumber");

-- CreateIndex
CREATE INDEX "FuelEntry_fuelEntryNumber_idx" ON "FuelEntry"("fuelEntryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_companyId_inspectionNumber_key" ON "Inspection"("companyId", "inspectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_companyId_itemNumber_key" ON "InventoryItem"("companyId", "itemNumber");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_loadId_idx" ON "Invoice"("loadId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_status_idx" ON "Invoice"("customerId", "status");

-- CreateIndex
CREATE INDEX "Invoice_customerId_status_createdAt_idx" ON "Invoice"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_status_createdAt_idx" ON "Invoice"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_mcNumber_status_idx" ON "Invoice"("mcNumber", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatch_companyId_batchNumber_key" ON "InvoiceBatch"("companyId", "batchNumber");

-- CreateIndex
CREATE INDEX "Load_companyId_mcNumberId_status_idx" ON "Load"("companyId", "mcNumberId", "status");

-- CreateIndex
CREATE INDEX "Load_companyId_mcNumberId_createdAt_idx" ON "Load"("companyId", "mcNumberId", "createdAt");

-- CreateIndex
CREATE INDEX "Load_companyId_driverId_status_idx" ON "Load"("companyId", "driverId", "status");

-- CreateIndex
CREATE INDEX "Load_companyId_status_createdAt_idx" ON "Load"("companyId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoadExpense_expenseNumber_key" ON "LoadExpense"("expenseNumber");

-- CreateIndex
CREATE INDEX "LoadExpense_expenseNumber_idx" ON "LoadExpense"("expenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Location_companyId_locationNumber_key" ON "Location"("companyId", "locationNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_maintenanceNumber_idx" ON "MaintenanceRecord"("maintenanceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRecord_companyId_maintenanceNumber_key" ON "MaintenanceRecord"("companyId", "maintenanceNumber");

-- CreateIndex
CREATE INDEX "Settlement_driverId_status_idx" ON "Settlement"("driverId", "status");

-- CreateIndex
CREATE INDEX "Settlement_driverId_status_createdAt_idx" ON "Settlement"("driverId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Settlement_driverId_createdAt_idx" ON "Settlement"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "Settlement_status_createdAt_idx" ON "Settlement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Settlement_salaryBatchId_idx" ON "Settlement"("salaryBatchId");

-- CreateIndex
CREATE INDEX "Tariff_customerId_idx" ON "Tariff"("customerId");

-- CreateIndex
CREATE INDEX "Tariff_originZip_destinationZip_idx" ON "Tariff"("originZip", "destinationZip");

-- CreateIndex
CREATE UNIQUE INDEX "Trailer_companyId_vin_key" ON "Trailer"("companyId", "vin");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_companyId_vin_key" ON "Truck"("companyId", "vin");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_companyId_isActive_idx" ON "TruckFaultHistory"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "TruckFaultHistory_companyId_category_idx" ON "TruckFaultHistory"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeNumber_key" ON "User"("employeeNumber");

-- CreateIndex
CREATE INDEX "User_employeeNumber_idx" ON "User"("employeeNumber");

-- CreateIndex
CREATE INDEX "Vendor_createdById_idx" ON "Vendor"("createdById");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownAssignment" ADD CONSTRAINT "BreakdownAssignment_breakdownId_fkey" FOREIGN KEY ("breakdownId") REFERENCES "Breakdown"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownAssignment" ADD CONSTRAINT "BreakdownAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_salaryBatchId_fkey" FOREIGN KEY ("salaryBatchId") REFERENCES "SalaryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryBatch" ADD CONSTRAINT "SalaryBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryBatch" ADD CONSTRAINT "SalaryBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNegativeBalance" ADD CONSTRAINT "DriverNegativeBalance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNegativeBalance" ADD CONSTRAINT "DriverNegativeBalance_originalSettlementId_fkey" FOREIGN KEY ("originalSettlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNegativeBalance" ADD CONSTRAINT "DriverNegativeBalance_appliedSettlementId_fkey" FOREIGN KEY ("appliedSettlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadExpense" ADD CONSTRAINT "LoadExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionRule" ADD CONSTRAINT "DeductionRule_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionTypeTemplate" ADD CONSTRAINT "DeductionTypeTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnomaly" ADD CONSTRAINT "AIAnomaly_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnomaly" ADD CONSTRAINT "AIAnomaly_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSettings" ADD CONSTRAINT "IntegrationSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserColumnPreference" ADD CONSTRAINT "UserColumnPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramDriverMapping" ADD CONSTRAINT "TelegramDriverMapping_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResponseLog" ADD CONSTRAINT "AIResponseLog_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeBaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SamsaraSettings" ADD CONSTRAINT "SamsaraSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickBooksSettings" ADD CONSTRAINT "QuickBooksSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyConfig" ADD CONSTRAINT "ApiKeyConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyConfig" ADD CONSTRAINT "ApiKeyConfig_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmIntegration" ADD CONSTRAINT "CrmIntegration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingSettings" ADD CONSTRAINT "AccountingSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
