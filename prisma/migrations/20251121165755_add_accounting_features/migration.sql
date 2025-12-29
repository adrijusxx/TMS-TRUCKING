/*
  Warnings:

  - The `subStatus` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `factoringCompany` on the `InvoiceBatch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,mcNumberId,type,name]` on the table `Classification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,category,key]` on the table `DefaultConfiguration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `DocumentTemplate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,entityType,name]` on the table `DynamicStatus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `ExpenseCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `ExpenseType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `NetProfitFormula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `OrderPaymentType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,paymentType]` on the table `PaymentConfiguration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `ReportConstructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `ReportTemplate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,category,key]` on the table `SafetyConfiguration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `Tariff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mcNumberId,name]` on the table `WorkOrderType` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `MaintenanceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OnCallShiftType" AS ENUM ('DAY', 'NIGHT', 'WEEKEND', 'HOLIDAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FactoringStatus" AS ENUM ('NOT_FACTORED', 'SUBMITTED_TO_FACTOR', 'FUNDED', 'RESERVE_RELEASED');

-- CreateEnum
CREATE TYPE "InvoiceSubStatus" AS ENUM ('NOT_YET_DUE', 'DUE_SOON', 'OVERDUE', 'PARTIALLY_PAID', 'DISPUTED', 'WRITTEN_OFF', 'PAID');

-- CreateEnum
CREATE TYPE "AccessorialChargeType" AS ENUM ('DETENTION', 'LAYOVER', 'TONU', 'LUMPER', 'SCALE_TICKET', 'ADDITIONAL_STOP', 'FUEL_SURCHARGE', 'RECLASSIFICATION', 'REEFER_FUEL', 'DRIVER_ASSIST', 'SORT_SEGREGATE', 'INSIDE_DELIVERY', 'RESIDENTIAL_DELIVERY', 'SATURDAY_DELIVERY', 'AFTER_HOURS', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessorialChargeStatus" AS ENUM ('PENDING', 'APPROVED', 'BILLED', 'PAID', 'DENIED');

-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('FUEL_ADVANCE', 'INSURANCE', 'EQUIPMENT_RENTAL', 'MAINTENANCE', 'TOLLS', 'PERMITS', 'FUEL_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ReconciliationMethod" AS ENUM ('AUTO', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "DQFStatus" AS ENUM ('COMPLETE', 'INCOMPLETE', 'EXPIRING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DQFDocumentType" AS ENUM ('APPLICATION', 'ROAD_TEST', 'PREVIOUS_EMPLOYMENT_VERIFICATION', 'ANNUAL_REVIEW', 'MEDICAL_EXAMINERS_CERTIFICATE', 'CDL_COPY', 'MVR_RECORD', 'DRUG_TEST_RESULT', 'ALCOHOL_TEST_RESULT', 'TRAINING_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DQFDocumentStatus" AS ENUM ('COMPLETE', 'MISSING', 'EXPIRING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DrugAlcoholTestType" AS ENUM ('PRE_EMPLOYMENT', 'RANDOM', 'POST_ACCIDENT', 'REASONABLE_SUSPICION', 'RETURN_TO_DUTY', 'FOLLOW_UP', 'PRE_DUTY');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('NEGATIVE', 'POSITIVE', 'REFUSAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoolType" AS ENUM ('DRUG', 'ALCOHOL');

-- CreateEnum
CREATE TYPE "ClearinghouseQueryType" AS ENUM ('PRE_EMPLOYMENT', 'ANNUAL', 'LIMITED');

-- CreateEnum
CREATE TYPE "ClearinghouseQueryResult" AS ENUM ('NO_VIOLATIONS', 'VIOLATIONS_FOUND', 'PENDING', 'ERROR');

-- CreateEnum
CREATE TYPE "HOSViolationType" AS ENUM ('FORM_AND_MANNER', 'UNASSIGNED_DRIVING', 'EXCEEDED_11_HOUR', 'EXCEEDED_14_HOUR', 'EXCEEDED_70_HOUR', 'MISSING_LOG', 'DATA_QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ELDProviderType" AS ENUM ('SAMSARA', 'KEEPTRUCKIN', 'VERIZON_CONNECT', 'GARMIN', 'RAND_MCNALLY', 'OTHER');

-- CreateEnum
CREATE TYPE "ELDSyncType" AS ENUM ('FULL', 'INCREMENTAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "ELDSyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "AnnualReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DVIRType" AS ENUM ('PRE_TRIP', 'POST_TRIP');

-- CreateEnum
CREATE TYPE "DVIRStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'DEFECT_REPORTED', 'REPAIRED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('CRITICAL', 'NON_CRITICAL');

-- CreateEnum
CREATE TYPE "InspectionLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_5', 'LEVEL_6');

-- CreateEnum
CREATE TYPE "CSABasicCategory" AS ENUM ('UNSAFE_DRIVING', 'CRASH_INDICATOR', 'HOS_COMPLIANCE', 'VEHICLE_MAINTENANCE', 'CONTROLLED_SUBSTANCES', 'HAZMAT_COMPLIANCE', 'DRIVER_FITNESS');

-- CreateEnum
CREATE TYPE "DataQStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OOSType" AS ENUM ('DRIVER', 'VEHICLE');

-- CreateEnum
CREATE TYPE "OOSStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DefectSourceType" AS ENUM ('DVIR', 'DOT_INSPECTION', 'ROADSIDE_INSPECTION', 'COMPANY_INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PreventableDecision" AS ENUM ('PREVENTABLE', 'NON_PREVENTABLE');

-- CreateEnum
CREATE TYPE "CSATrend" AS ENUM ('IMPROVING', 'DECLINING', 'STABLE');

-- CreateEnum
CREATE TYPE "SafetyRating" AS ENUM ('SATISFACTORY', 'CONDITIONAL', 'UNSATISFACTORY');

-- CreateEnum
CREATE TYPE "CompliancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplianceActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InsurancePolicyType" AS ENUM ('LIABILITY', 'PHYSICAL_DAMAGE', 'CARGO', 'GENERAL_LIABILITY');

-- CreateEnum
CREATE TYPE "InsuranceClaimType" AS ENUM ('ACCIDENT', 'CARGO', 'PROPERTY_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED', 'DENIED');

-- CreateEnum
CREATE TYPE "CargoClaimStatus" AS ENUM ('OPEN', 'DENIED', 'SETTLED', 'PAID');

-- CreateEnum
CREATE TYPE "LossRunType" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SafetyPolicyCategory" AS ENUM ('ACCIDENT_PROCEDURES', 'DRUG_ALCOHOL_POLICY', 'VEHICLE_USE_POLICY', 'PERSONAL_CONDUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "AcknowledgmentStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SafetyCampaignType" AS ENUM ('MILLION_MILE_CLUB', 'NO_PREVENTABLE_ACCIDENTS', 'BEST_PRE_TRIP_INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyRecognitionType" AS ENUM ('YEARS_WITHOUT_ACCIDENT', 'MILESTONE_MILES', 'SAFETY_LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingMaterialCategory" AS ENUM ('DEFENSIVE_DRIVING', 'WINTER_DRIVING', 'CARGO_SECUREMENT', 'HOS_RULES', 'ELD_TRAINING', 'HAZMAT', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingMaterialType" AS ENUM ('VIDEO', 'POWERPOINT', 'HANDOUT', 'QUIZ', 'PDF');

-- CreateEnum
CREATE TYPE "ComplianceAlertType" AS ENUM ('EXPIRING_DOCUMENT', 'MISSED_DRUG_TEST', 'HOS_VIOLATION', 'OVERDUE_INSPECTION', 'HIGH_CSA_SCORE', 'NEW_VIOLATION', 'OOS_ORDER', 'OVERDUE_ANNUAL_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'FACTOR';
ALTER TYPE "PaymentMethod" ADD VALUE 'QUICK_PAY';

-- DropIndex
DROP INDEX "Classification_companyId_type_name_key";

-- DropIndex
DROP INDEX "DefaultConfiguration_companyId_category_key_key";

-- DropIndex
DROP INDEX "DocumentTemplate_companyId_name_key";

-- DropIndex
DROP INDEX "DynamicStatus_companyId_entityType_name_key";

-- DropIndex
DROP INDEX "ExpenseCategory_companyId_name_key";

-- DropIndex
DROP INDEX "ExpenseType_companyId_name_key";

-- DropIndex
DROP INDEX "NetProfitFormula_companyId_name_key";

-- DropIndex
DROP INDEX "OrderPaymentType_companyId_name_key";

-- DropIndex
DROP INDEX "PaymentConfiguration_companyId_paymentType_key";

-- DropIndex
DROP INDEX "ReportConstructor_companyId_name_key";

-- DropIndex
DROP INDEX "ReportTemplate_companyId_name_key";

-- DropIndex
DROP INDEX "SafetyConfiguration_companyId_category_key_key";

-- DropIndex
DROP INDEX "Tariff_companyId_name_key";

-- DropIndex
DROP INDEX "WorkOrderType_companyId_name_key";

-- AlterTable
ALTER TABLE "Breakdown" ADD COLUMN     "trailerId" TEXT;

-- AlterTable
ALTER TABLE "Classification" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "creditAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
ADD COLUMN     "creditHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creditHoldDate" TIMESTAMP(3),
ADD COLUMN     "creditHoldReason" TEXT,
ADD COLUMN     "creditLimitNotes" TEXT,
ADD COLUMN     "discountDays" INTEGER,
ADD COLUMN     "discountPercentage" DOUBLE PRECISION,
ADD COLUMN     "factoringCompanyId" TEXT,
ADD COLUMN     "paymentTermsType" TEXT,
ADD COLUMN     "preferredPaymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "DefaultConfiguration" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "DocumentTemplate" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "DynamicStatus" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "ExpenseCategory" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "ExpenseType" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "advanceAmount" DOUBLE PRECISION,
ADD COLUMN     "disputedAt" TIMESTAMP(3),
ADD COLUMN     "disputedReason" TEXT,
ADD COLUMN     "expectedPaymentDate" TIMESTAMP(3),
ADD COLUMN     "factoringCompanyId" TEXT,
ADD COLUMN     "factoringFee" DOUBLE PRECISION,
ADD COLUMN     "factoringStatus" "FactoringStatus" NOT NULL DEFAULT 'NOT_FACTORED',
ADD COLUMN     "fundedAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "reserveAmount" DOUBLE PRECISION,
ADD COLUMN     "reserveReleaseDate" TIMESTAMP(3),
ADD COLUMN     "shortPayAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shortPayApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shortPayApprovedAt" TIMESTAMP(3),
ADD COLUMN     "shortPayApprovedById" TEXT,
ADD COLUMN     "shortPayReason" TEXT,
ADD COLUMN     "shortPayReasonCode" TEXT,
ADD COLUMN     "submittedToFactorAt" TIMESTAMP(3),
ADD COLUMN     "writtenOffAt" TIMESTAMP(3),
ADD COLUMN     "writtenOffById" TEXT,
ADD COLUMN     "writtenOffReason" TEXT,
DROP COLUMN "subStatus",
ADD COLUMN     "subStatus" "InvoiceSubStatus";

-- AlterTable
ALTER TABLE "InvoiceBatch" DROP COLUMN "factoringCompany",
ADD COLUMN     "factoringCompanyId" TEXT,
ADD COLUMN     "factoringCompanyName" TEXT;

-- AlterTable
ALTER TABLE "MaintenanceRecord" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "NetProfitFormula" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "OrderPaymentType" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "PaymentConfiguration" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "Reconciliation" ADD COLUMN     "reconciliationMethod" "ReconciliationMethod" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "ReportConstructor" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "ReportTemplate" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "SafetyConfiguration" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "Settlement" ADD COLUMN     "is1099Eligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "year1099" INTEGER;

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "mcNumberId" TEXT;

-- AlterTable
ALTER TABLE "WorkOrderType" ADD COLUMN     "mcNumberId" TEXT;

-- CreateTable
CREATE TABLE "OnCallShift" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "shiftType" "OnCallShiftType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OnCallShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementDeduction" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "deductionType" "DeductionType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fuelEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringCompany" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "reservePercentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "reserveHoldDays" INTEGER NOT NULL DEFAULT 90,
    "apiProvider" TEXT,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "exportFormat" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessorialCharge" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "chargeType" "AccessorialChargeType" NOT NULL,
    "description" TEXT,
    "detentionHours" DOUBLE PRECISION,
    "detentionRate" DOUBLE PRECISION,
    "layoverDays" INTEGER,
    "layoverRate" DOUBLE PRECISION,
    "tonuReason" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "AccessorialChargeStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessorialCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateConfirmation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "rateConfNumber" TEXT,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "fuelSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accessorialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRate" DOUBLE PRECISION NOT NULL,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "paymentMethod" TEXT,
    "documentId" TEXT,
    "matchedToInvoice" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" TEXT,
    "matchedAt" TIMESTAMP(3),
    "matchedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverQualificationFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "DQFStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DriverQualificationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DQFDocument" (
    "id" TEXT NOT NULL,
    "dqfId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" "DQFDocumentType" NOT NULL,
    "status" "DQFDocumentStatus" NOT NULL DEFAULT 'MISSING',
    "expirationDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DQFDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCard" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3),
    "medicalExaminerName" TEXT,
    "medicalExaminerCertificateNumber" TEXT,
    "waiverInformation" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MedicalCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CDLRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "cdlNumber" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3),
    "issueState" TEXT NOT NULL,
    "licenseClass" TEXT,
    "endorsements" TEXT[],
    "restrictions" TEXT[],
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CDLRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MVRRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pullDate" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "nextPullDueDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MVRRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MVRViolation" (
    "id" TEXT NOT NULL,
    "mvrRecordId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "violationDescription" TEXT NOT NULL,
    "violationDate" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL,
    "points" INTEGER,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MVRViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugAlcoholTest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "testType" "DrugAlcoholTestType" NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "result" "TestResult" NOT NULL,
    "isRandom" BOOLEAN NOT NULL DEFAULT false,
    "randomSelectionId" TEXT,
    "labName" TEXT,
    "labAddress" TEXT,
    "labPhone" TEXT,
    "labReportNumber" TEXT,
    "collectionSiteName" TEXT,
    "collectionSiteAddress" TEXT,
    "mroName" TEXT,
    "mroPhone" TEXT,
    "notes" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DrugAlcoholTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestingPool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "poolType" "PoolType" NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestingPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestingPoolDriver" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestingPoolDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomSelection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "selectionDate" TIMESTAMP(3) NOT NULL,
    "selectionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RandomSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomSelectedDriver" (
    "id" TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "testCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomSelectedDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FMCSAClearinghouseQuery" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "queryDate" TIMESTAMP(3) NOT NULL,
    "queryType" "ClearinghouseQueryType" NOT NULL,
    "result" "ClearinghouseQueryResult",
    "violationsFound" BOOLEAN NOT NULL DEFAULT false,
    "violationDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FMCSAClearinghouseQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HOSViolation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "violationDate" TIMESTAMP(3) NOT NULL,
    "violationType" "HOSViolationType" NOT NULL,
    "violationDescription" TEXT NOT NULL,
    "hoursExceeded" DOUBLE PRECISION,
    "eldProvider" TEXT,
    "eldRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HOSViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ELDProvider" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerType" "ELDProviderType" NOT NULL,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ELDProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ELDSyncLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "syncDate" TIMESTAMP(3) NOT NULL,
    "syncType" "ELDSyncType" NOT NULL,
    "status" "ELDSyncStatus" NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ELDSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "reviewYear" INTEGER NOT NULL,
    "mvrReviewed" BOOLEAN NOT NULL DEFAULT false,
    "violationReviewed" BOOLEAN NOT NULL DEFAULT false,
    "accidentReviewed" BOOLEAN NOT NULL DEFAULT false,
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "performanceDiscussed" BOOLEAN NOT NULL DEFAULT false,
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "performanceNotes" TEXT,
    "actionItems" TEXT,
    "driverSignedAt" TIMESTAMP(3),
    "reviewerSignedAt" TIMESTAMP(3),
    "status" "AnnualReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AnnualReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVIR" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "inspectionType" "DVIRType" NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "brakesOk" BOOLEAN NOT NULL DEFAULT true,
    "tiresOk" BOOLEAN NOT NULL DEFAULT true,
    "lightsOk" BOOLEAN NOT NULL DEFAULT true,
    "couplingOk" BOOLEAN NOT NULL DEFAULT true,
    "steeringOk" BOOLEAN NOT NULL DEFAULT true,
    "suspensionOk" BOOLEAN NOT NULL DEFAULT true,
    "frameOk" BOOLEAN NOT NULL DEFAULT true,
    "cargoSecurementOk" BOOLEAN NOT NULL DEFAULT true,
    "emergencyEquipmentOk" BOOLEAN NOT NULL DEFAULT true,
    "driverSignedAt" TIMESTAMP(3),
    "driverSignature" TEXT,
    "mechanicSignedAt" TIMESTAMP(3),
    "mechanicSignature" TEXT,
    "status" "DVIRStatus" NOT NULL DEFAULT 'COMPLETED',
    "vehicleNeedsRepair" BOOLEAN NOT NULL DEFAULT false,
    "workOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DVIR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVIRDefect" (
    "id" TEXT NOT NULL,
    "dvirId" TEXT NOT NULL,
    "inspectionPoint" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "location" TEXT,
    "photoDocumentIds" TEXT[],
    "workOrderId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVIRDefect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadsideInspection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectionLocation" TEXT NOT NULL,
    "inspectionState" TEXT NOT NULL,
    "inspectionLevel" "InspectionLevel" NOT NULL,
    "inspectorName" TEXT,
    "inspectorBadgeNumber" TEXT,
    "violationsFound" BOOLEAN NOT NULL DEFAULT false,
    "outOfService" BOOLEAN NOT NULL DEFAULT false,
    "oosReason" TEXT,
    "dataQSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "dataQSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RoadsideInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadsideViolation" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "violationDescription" TEXT NOT NULL,
    "severityWeight" DOUBLE PRECISION,
    "basicCategory" "CSABasicCategory",
    "dataQSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "dataQStatus" "DataQStatus",
    "dataQSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadsideViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutOfServiceOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "oosDate" TIMESTAMP(3) NOT NULL,
    "oosReason" TEXT NOT NULL,
    "oosType" "OOSType" NOT NULL,
    "requiredCorrectiveAction" TEXT,
    "inspectorName" TEXT,
    "inspectorBadgeNumber" TEXT,
    "inspectionId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "verificationDocumentId" TEXT,
    "status" "OOSStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OutOfServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT,
    "sourceType" "DefectSourceType" NOT NULL,
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "location" TEXT,
    "reportedDate" TIMESTAMP(3) NOT NULL,
    "workOrderId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "timeToRepair" INTEGER,
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccidentPhoto" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccidentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "investigatorId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "driverInterviewed" BOOLEAN NOT NULL DEFAULT false,
    "eldDataReviewed" BOOLEAN NOT NULL DEFAULT false,
    "vehicleExamined" BOOLEAN NOT NULL DEFAULT false,
    "photosReviewed" BOOLEAN NOT NULL DEFAULT false,
    "witnessStatementsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "policeReportReviewed" BOOLEAN NOT NULL DEFAULT false,
    "contributingFactors" TEXT,
    "rootCause" TEXT,
    "findings" TEXT,
    "correctiveActions" TEXT,
    "recommendations" TEXT,
    "trainingScheduled" BOOLEAN NOT NULL DEFAULT false,
    "trainingId" TEXT,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventableDetermination" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewCommitteeMembers" TEXT[],
    "determination" "PreventableDecision" NOT NULL,
    "justification" TEXT NOT NULL,
    "appealed" BOOLEAN NOT NULL DEFAULT false,
    "appealDate" TIMESTAMP(3),
    "appealReason" TEXT,
    "appealDecision" "PreventableDecision",
    "appealJustification" TEXT,
    "driverScoreImpact" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventableDetermination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventableVote" (
    "id" TEXT NOT NULL,
    "determinationId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "vote" "PreventableDecision" NOT NULL,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreventableVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NearMiss" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "contributingFactors" TEXT,
    "suggestions" TEXT,
    "patternIdentified" BOOLEAN NOT NULL DEFAULT false,
    "trainingNeeded" BOOLEAN NOT NULL DEFAULT false,
    "policyChangeNeeded" BOOLEAN NOT NULL DEFAULT false,
    "actionItems" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "reportedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NearMiss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "officerName" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "citedParty" TEXT,
    "violationsIssued" TEXT[],
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WitnessStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "witnessName" TEXT NOT NULL,
    "witnessPhone" TEXT,
    "witnessEmail" TEXT,
    "witnessAddress" TEXT,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "statement" TEXT NOT NULL,
    "documentId" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WitnessStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CSAScore" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "scoreDate" TIMESTAMP(3) NOT NULL,
    "basicCategory" "CSABasicCategory" NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION,
    "previousPercentile" DOUBLE PRECISION,
    "trend" "CSATrend",
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "violationDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CSAScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FMCSACompliance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "safetyRating" "SafetyRating",
    "safetyRatingDate" TIMESTAMP(3),
    "safetyRatingReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FMCSACompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReview" (
    "id" TEXT NOT NULL,
    "complianceId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewType" TEXT NOT NULL,
    "findings" TEXT,
    "correctiveActions" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceActionItem" (
    "id" TEXT NOT NULL,
    "complianceId" TEXT NOT NULL,
    "actionItem" TEXT NOT NULL,
    "priority" "CompliancePriority" NOT NULL,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "status" "ComplianceActionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQSubmission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "violationId" TEXT,
    "submissionDate" TIMESTAMP(3) NOT NULL,
    "fmcsatrackingNumber" TEXT NOT NULL,
    "violationChallenged" TEXT NOT NULL,
    "reasonForChallenge" TEXT NOT NULL,
    "supportingDocumentIds" TEXT[],
    "status" "DataQStatus" NOT NULL DEFAULT 'PENDING',
    "responseDate" TIMESTAMP(3),
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "policyType" "InsurancePolicyType" NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "insuranceCompany" TEXT NOT NULL,
    "agentName" TEXT,
    "agentPhone" TEXT,
    "agentEmail" TEXT,
    "coverageLimit" DOUBLE PRECISION,
    "deductible" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceCertificate" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "certificateHolder" TEXT NOT NULL,
    "additionalInsured" BOOLEAN NOT NULL DEFAULT false,
    "expirationDate" TIMESTAMP(3),
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "policyId" TEXT,
    "incidentId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "claimType" "InsuranceClaimType" NOT NULL,
    "dateOfLoss" TIMESTAMP(3) NOT NULL,
    "insuranceCompany" TEXT NOT NULL,
    "adjusterName" TEXT,
    "adjusterPhone" TEXT,
    "adjusterEmail" TEXT,
    "estimatedLoss" DOUBLE PRECISION,
    "reserveAmount" DOUBLE PRECISION,
    "paidAmount" DOUBLE PRECISION,
    "settlementAmount" DOUBLE PRECISION,
    "settlementDate" TIMESTAMP(3),
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoClaim" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "shipper" TEXT,
    "consignee" TEXT,
    "bolNumber" TEXT,
    "product" TEXT,
    "valueClaimed" DOUBLE PRECISION,
    "causeOfDamage" TEXT,
    "claimDate" TIMESTAMP(3) NOT NULL,
    "status" "CargoClaimStatus" NOT NULL DEFAULT 'OPEN',
    "denied" BOOLEAN NOT NULL DEFAULT false,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "settlementAmount" DOUBLE PRECISION,
    "settlementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CargoClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyDamage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "damageType" TEXT NOT NULL,
    "damageDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "responsibility" TEXT,
    "customerAtFault" BOOLEAN NOT NULL DEFAULT false,
    "recoveryTracking" TEXT,
    "driverCoached" BOOLEAN NOT NULL DEFAULT false,
    "correctiveActions" TEXT,
    "preventionMeasures" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyDamage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LossRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportType" "LossRunType" NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "totalClaims" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReserve" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lossRatio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LossRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyMeeting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "meetingTime" TEXT,
    "location" TEXT,
    "topic" TEXT NOT NULL,
    "agenda" TEXT,
    "handoutDocumentIds" TEXT[],
    "minutes" TEXT,
    "actionItems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "signInTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "category" "SafetyPolicyCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "supersededDate" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "signature" TEXT,
    "status" "AcknowledgmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCampaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignType" "SafetyCampaignType" NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignParticipant" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "achievement" TEXT,
    "bonusAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyRecognition" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "recognitionType" "SafetyRecognitionType" NOT NULL,
    "achievement" TEXT NOT NULL,
    "recognitionDate" TIMESTAMP(3) NOT NULL,
    "certificateDocumentId" TEXT,
    "awardAmount" DOUBLE PRECISION,
    "announced" BOOLEAN NOT NULL DEFAULT false,
    "announcementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingMaterial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "category" "TrainingMaterialCategory" NOT NULL,
    "materialType" "TrainingMaterialType" NOT NULL,
    "description" TEXT,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAlert" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alertType" "ComplianceAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "assignedTo" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentToInvestigation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToInvestigation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToRoadsideInspection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToRoadsideInspection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToInsuranceClaim" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToInsuranceClaim_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AnnualReviewToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AnnualReviewToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DVIRToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DVIRToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ComplianceReviewToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComplianceReviewToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CargoClaimToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CargoClaimToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "OnCallShift_companyId_idx" ON "OnCallShift"("companyId");

-- CreateIndex
CREATE INDEX "OnCallShift_assignedToId_idx" ON "OnCallShift"("assignedToId");

-- CreateIndex
CREATE INDEX "OnCallShift_startDate_idx" ON "OnCallShift"("startDate");

-- CreateIndex
CREATE INDEX "OnCallShift_endDate_idx" ON "OnCallShift"("endDate");

-- CreateIndex
CREATE INDEX "SettlementDeduction_settlementId_idx" ON "SettlementDeduction"("settlementId");

-- CreateIndex
CREATE INDEX "SettlementDeduction_deductionType_idx" ON "SettlementDeduction"("deductionType");

-- CreateIndex
CREATE INDEX "SettlementDeduction_fuelEntryId_idx" ON "SettlementDeduction"("fuelEntryId");

-- CreateIndex
CREATE INDEX "FactoringCompany_companyId_idx" ON "FactoringCompany"("companyId");

-- CreateIndex
CREATE INDEX "FactoringCompany_isActive_idx" ON "FactoringCompany"("isActive");

-- CreateIndex
CREATE INDEX "AccessorialCharge_companyId_idx" ON "AccessorialCharge"("companyId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_loadId_idx" ON "AccessorialCharge"("loadId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_invoiceId_idx" ON "AccessorialCharge"("invoiceId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_chargeType_idx" ON "AccessorialCharge"("chargeType");

-- CreateIndex
CREATE INDEX "AccessorialCharge_status_idx" ON "AccessorialCharge"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfirmation_documentId_key" ON "RateConfirmation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfirmation_invoiceId_key" ON "RateConfirmation"("invoiceId");

-- CreateIndex
CREATE INDEX "RateConfirmation_companyId_idx" ON "RateConfirmation"("companyId");

-- CreateIndex
CREATE INDEX "RateConfirmation_loadId_idx" ON "RateConfirmation"("loadId");

-- CreateIndex
CREATE INDEX "RateConfirmation_invoiceId_idx" ON "RateConfirmation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfirmation_loadId_key" ON "RateConfirmation"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverQualificationFile_driverId_key" ON "DriverQualificationFile"("driverId");

-- CreateIndex
CREATE INDEX "DriverQualificationFile_companyId_idx" ON "DriverQualificationFile"("companyId");

-- CreateIndex
CREATE INDEX "DriverQualificationFile_driverId_idx" ON "DriverQualificationFile"("driverId");

-- CreateIndex
CREATE INDEX "DriverQualificationFile_status_idx" ON "DriverQualificationFile"("status");

-- CreateIndex
CREATE INDEX "DQFDocument_dqfId_idx" ON "DQFDocument"("dqfId");

-- CreateIndex
CREATE INDEX "DQFDocument_documentType_idx" ON "DQFDocument"("documentType");

-- CreateIndex
CREATE INDEX "DQFDocument_status_idx" ON "DQFDocument"("status");

-- CreateIndex
CREATE INDEX "DQFDocument_expirationDate_idx" ON "DQFDocument"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "DQFDocument_dqfId_documentType_key" ON "DQFDocument"("dqfId", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCard_documentId_key" ON "MedicalCard"("documentId");

-- CreateIndex
CREATE INDEX "MedicalCard_companyId_idx" ON "MedicalCard"("companyId");

-- CreateIndex
CREATE INDEX "MedicalCard_driverId_idx" ON "MedicalCard"("driverId");

-- CreateIndex
CREATE INDEX "MedicalCard_expirationDate_idx" ON "MedicalCard"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "CDLRecord_driverId_key" ON "CDLRecord"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "CDLRecord_documentId_key" ON "CDLRecord"("documentId");

-- CreateIndex
CREATE INDEX "CDLRecord_companyId_idx" ON "CDLRecord"("companyId");

-- CreateIndex
CREATE INDEX "CDLRecord_driverId_idx" ON "CDLRecord"("driverId");

-- CreateIndex
CREATE INDEX "CDLRecord_expirationDate_idx" ON "CDLRecord"("expirationDate");

-- CreateIndex
CREATE INDEX "CDLRecord_cdlNumber_idx" ON "CDLRecord"("cdlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MVRRecord_documentId_key" ON "MVRRecord"("documentId");

-- CreateIndex
CREATE INDEX "MVRRecord_companyId_idx" ON "MVRRecord"("companyId");

-- CreateIndex
CREATE INDEX "MVRRecord_driverId_idx" ON "MVRRecord"("driverId");

-- CreateIndex
CREATE INDEX "MVRRecord_pullDate_idx" ON "MVRRecord"("pullDate");

-- CreateIndex
CREATE INDEX "MVRRecord_nextPullDueDate_idx" ON "MVRRecord"("nextPullDueDate");

-- CreateIndex
CREATE INDEX "MVRViolation_mvrRecordId_idx" ON "MVRViolation"("mvrRecordId");

-- CreateIndex
CREATE INDEX "MVRViolation_violationDate_idx" ON "MVRViolation"("violationDate");

-- CreateIndex
CREATE INDEX "MVRViolation_isNew_idx" ON "MVRViolation"("isNew");

-- CreateIndex
CREATE UNIQUE INDEX "DrugAlcoholTest_documentId_key" ON "DrugAlcoholTest"("documentId");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_companyId_idx" ON "DrugAlcoholTest"("companyId");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_driverId_idx" ON "DrugAlcoholTest"("driverId");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_testType_idx" ON "DrugAlcoholTest"("testType");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_testDate_idx" ON "DrugAlcoholTest"("testDate");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_result_idx" ON "DrugAlcoholTest"("result");

-- CreateIndex
CREATE INDEX "DrugAlcoholTest_isRandom_idx" ON "DrugAlcoholTest"("isRandom");

-- CreateIndex
CREATE INDEX "TestingPool_companyId_idx" ON "TestingPool"("companyId");

-- CreateIndex
CREATE INDEX "TestingPool_year_quarter_idx" ON "TestingPool"("year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "TestingPool_companyId_poolType_quarter_year_key" ON "TestingPool"("companyId", "poolType", "quarter", "year");

-- CreateIndex
CREATE INDEX "TestingPoolDriver_poolId_idx" ON "TestingPoolDriver"("poolId");

-- CreateIndex
CREATE INDEX "TestingPoolDriver_driverId_idx" ON "TestingPoolDriver"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "TestingPoolDriver_poolId_driverId_key" ON "TestingPoolDriver"("poolId", "driverId");

-- CreateIndex
CREATE INDEX "RandomSelection_companyId_idx" ON "RandomSelection"("companyId");

-- CreateIndex
CREATE INDEX "RandomSelection_poolId_idx" ON "RandomSelection"("poolId");

-- CreateIndex
CREATE INDEX "RandomSelection_selectionDate_idx" ON "RandomSelection"("selectionDate");

-- CreateIndex
CREATE INDEX "RandomSelectedDriver_selectionId_idx" ON "RandomSelectedDriver"("selectionId");

-- CreateIndex
CREATE INDEX "RandomSelectedDriver_driverId_idx" ON "RandomSelectedDriver"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "RandomSelectedDriver_selectionId_driverId_key" ON "RandomSelectedDriver"("selectionId", "driverId");

-- CreateIndex
CREATE INDEX "FMCSAClearinghouseQuery_companyId_idx" ON "FMCSAClearinghouseQuery"("companyId");

-- CreateIndex
CREATE INDEX "FMCSAClearinghouseQuery_driverId_idx" ON "FMCSAClearinghouseQuery"("driverId");

-- CreateIndex
CREATE INDEX "FMCSAClearinghouseQuery_queryDate_idx" ON "FMCSAClearinghouseQuery"("queryDate");

-- CreateIndex
CREATE INDEX "HOSViolation_companyId_idx" ON "HOSViolation"("companyId");

-- CreateIndex
CREATE INDEX "HOSViolation_driverId_idx" ON "HOSViolation"("driverId");

-- CreateIndex
CREATE INDEX "HOSViolation_violationDate_idx" ON "HOSViolation"("violationDate");

-- CreateIndex
CREATE INDEX "HOSViolation_violationType_idx" ON "HOSViolation"("violationType");

-- CreateIndex
CREATE INDEX "ELDProvider_companyId_idx" ON "ELDProvider"("companyId");

-- CreateIndex
CREATE INDEX "ELDProvider_providerName_idx" ON "ELDProvider"("providerName");

-- CreateIndex
CREATE INDEX "ELDSyncLog_providerId_idx" ON "ELDSyncLog"("providerId");

-- CreateIndex
CREATE INDEX "ELDSyncLog_syncDate_idx" ON "ELDSyncLog"("syncDate");

-- CreateIndex
CREATE INDEX "ELDSyncLog_status_idx" ON "ELDSyncLog"("status");

-- CreateIndex
CREATE INDEX "AnnualReview_companyId_idx" ON "AnnualReview"("companyId");

-- CreateIndex
CREATE INDEX "AnnualReview_driverId_idx" ON "AnnualReview"("driverId");

-- CreateIndex
CREATE INDEX "AnnualReview_reviewDate_idx" ON "AnnualReview"("reviewDate");

-- CreateIndex
CREATE INDEX "AnnualReview_dueDate_idx" ON "AnnualReview"("dueDate");

-- CreateIndex
CREATE INDEX "AnnualReview_status_idx" ON "AnnualReview"("status");

-- CreateIndex
CREATE INDEX "DVIR_companyId_idx" ON "DVIR"("companyId");

-- CreateIndex
CREATE INDEX "DVIR_driverId_idx" ON "DVIR"("driverId");

-- CreateIndex
CREATE INDEX "DVIR_truckId_idx" ON "DVIR"("truckId");

-- CreateIndex
CREATE INDEX "DVIR_inspectionDate_idx" ON "DVIR"("inspectionDate");

-- CreateIndex
CREATE INDEX "DVIR_status_idx" ON "DVIR"("status");

-- CreateIndex
CREATE INDEX "DVIRDefect_dvirId_idx" ON "DVIRDefect"("dvirId");

-- CreateIndex
CREATE INDEX "DVIRDefect_severity_idx" ON "DVIRDefect"("severity");

-- CreateIndex
CREATE INDEX "DVIRDefect_workOrderId_idx" ON "DVIRDefect"("workOrderId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_companyId_idx" ON "RoadsideInspection"("companyId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_driverId_idx" ON "RoadsideInspection"("driverId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_truckId_idx" ON "RoadsideInspection"("truckId");

-- CreateIndex
CREATE INDEX "RoadsideInspection_inspectionDate_idx" ON "RoadsideInspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "RoadsideInspection_inspectionLevel_idx" ON "RoadsideInspection"("inspectionLevel");

-- CreateIndex
CREATE INDEX "RoadsideInspection_outOfService_idx" ON "RoadsideInspection"("outOfService");

-- CreateIndex
CREATE INDEX "RoadsideViolation_inspectionId_idx" ON "RoadsideViolation"("inspectionId");

-- CreateIndex
CREATE INDEX "RoadsideViolation_violationCode_idx" ON "RoadsideViolation"("violationCode");

-- CreateIndex
CREATE INDEX "RoadsideViolation_basicCategory_idx" ON "RoadsideViolation"("basicCategory");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_companyId_idx" ON "OutOfServiceOrder"("companyId");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_driverId_idx" ON "OutOfServiceOrder"("driverId");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_truckId_idx" ON "OutOfServiceOrder"("truckId");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_oosDate_idx" ON "OutOfServiceOrder"("oosDate");

-- CreateIndex
CREATE INDEX "OutOfServiceOrder_status_idx" ON "OutOfServiceOrder"("status");

-- CreateIndex
CREATE INDEX "Defect_companyId_idx" ON "Defect"("companyId");

-- CreateIndex
CREATE INDEX "Defect_truckId_idx" ON "Defect"("truckId");

-- CreateIndex
CREATE INDEX "Defect_severity_idx" ON "Defect"("severity");

-- CreateIndex
CREATE INDEX "Defect_status_idx" ON "Defect"("status");

-- CreateIndex
CREATE INDEX "Defect_reportedDate_idx" ON "Defect"("reportedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_incidentId_key" ON "Investigation"("incidentId");

-- CreateIndex
CREATE INDEX "Investigation_companyId_idx" ON "Investigation"("companyId");

-- CreateIndex
CREATE INDEX "Investigation_incidentId_idx" ON "Investigation"("incidentId");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Investigation_dueDate_idx" ON "Investigation"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PreventableDetermination_incidentId_key" ON "PreventableDetermination"("incidentId");

-- CreateIndex
CREATE INDEX "PreventableDetermination_companyId_idx" ON "PreventableDetermination"("companyId");

-- CreateIndex
CREATE INDEX "PreventableDetermination_incidentId_idx" ON "PreventableDetermination"("incidentId");

-- CreateIndex
CREATE INDEX "PreventableDetermination_determination_idx" ON "PreventableDetermination"("determination");

-- CreateIndex
CREATE INDEX "PreventableVote_determinationId_idx" ON "PreventableVote"("determinationId");

-- CreateIndex
CREATE UNIQUE INDEX "PreventableVote_determinationId_voterId_key" ON "PreventableVote"("determinationId", "voterId");

-- CreateIndex
CREATE INDEX "NearMiss_companyId_idx" ON "NearMiss"("companyId");

-- CreateIndex
CREATE INDEX "NearMiss_driverId_idx" ON "NearMiss"("driverId");

-- CreateIndex
CREATE INDEX "NearMiss_reportDate_idx" ON "NearMiss"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceReport_documentId_key" ON "PoliceReport"("documentId");

-- CreateIndex
CREATE INDEX "PoliceReport_companyId_idx" ON "PoliceReport"("companyId");

-- CreateIndex
CREATE INDEX "PoliceReport_incidentId_idx" ON "PoliceReport"("incidentId");

-- CreateIndex
CREATE INDEX "PoliceReport_reportNumber_idx" ON "PoliceReport"("reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WitnessStatement_documentId_key" ON "WitnessStatement"("documentId");

-- CreateIndex
CREATE INDEX "WitnessStatement_companyId_idx" ON "WitnessStatement"("companyId");

-- CreateIndex
CREATE INDEX "WitnessStatement_incidentId_idx" ON "WitnessStatement"("incidentId");

-- CreateIndex
CREATE INDEX "CSAScore_companyId_idx" ON "CSAScore"("companyId");

-- CreateIndex
CREATE INDEX "CSAScore_scoreDate_idx" ON "CSAScore"("scoreDate");

-- CreateIndex
CREATE INDEX "CSAScore_basicCategory_idx" ON "CSAScore"("basicCategory");

-- CreateIndex
CREATE UNIQUE INDEX "FMCSACompliance_companyId_key" ON "FMCSACompliance"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceReview_complianceId_idx" ON "ComplianceReview"("complianceId");

-- CreateIndex
CREATE INDEX "ComplianceReview_reviewDate_idx" ON "ComplianceReview"("reviewDate");

-- CreateIndex
CREATE INDEX "ComplianceActionItem_complianceId_idx" ON "ComplianceActionItem"("complianceId");

-- CreateIndex
CREATE INDEX "ComplianceActionItem_status_idx" ON "ComplianceActionItem"("status");

-- CreateIndex
CREATE INDEX "ComplianceActionItem_dueDate_idx" ON "ComplianceActionItem"("dueDate");

-- CreateIndex
CREATE INDEX "DataQSubmission_companyId_idx" ON "DataQSubmission"("companyId");

-- CreateIndex
CREATE INDEX "DataQSubmission_violationId_idx" ON "DataQSubmission"("violationId");

-- CreateIndex
CREATE INDEX "DataQSubmission_status_idx" ON "DataQSubmission"("status");

-- CreateIndex
CREATE INDEX "DataQSubmission_submissionDate_idx" ON "DataQSubmission"("submissionDate");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_documentId_key" ON "InsurancePolicy"("documentId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_companyId_idx" ON "InsurancePolicy"("companyId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_policyType_idx" ON "InsurancePolicy"("policyType");

-- CreateIndex
CREATE INDEX "InsurancePolicy_renewalDate_idx" ON "InsurancePolicy"("renewalDate");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceCertificate_documentId_key" ON "InsuranceCertificate"("documentId");

-- CreateIndex
CREATE INDEX "InsuranceCertificate_policyId_idx" ON "InsuranceCertificate"("policyId");

-- CreateIndex
CREATE INDEX "InsuranceCertificate_expirationDate_idx" ON "InsuranceCertificate"("expirationDate");

-- CreateIndex
CREATE INDEX "InsuranceClaim_companyId_idx" ON "InsuranceClaim"("companyId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_policyId_idx" ON "InsuranceClaim"("policyId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_incidentId_idx" ON "InsuranceClaim"("incidentId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_status_idx" ON "InsuranceClaim"("status");

-- CreateIndex
CREATE INDEX "InsuranceClaim_dateOfLoss_idx" ON "InsuranceClaim"("dateOfLoss");

-- CreateIndex
CREATE INDEX "CargoClaim_companyId_idx" ON "CargoClaim"("companyId");

-- CreateIndex
CREATE INDEX "CargoClaim_loadId_idx" ON "CargoClaim"("loadId");

-- CreateIndex
CREATE INDEX "CargoClaim_status_idx" ON "CargoClaim"("status");

-- CreateIndex
CREATE INDEX "CargoClaim_claimDate_idx" ON "CargoClaim"("claimDate");

-- CreateIndex
CREATE INDEX "PropertyDamage_companyId_idx" ON "PropertyDamage"("companyId");

-- CreateIndex
CREATE INDEX "PropertyDamage_driverId_idx" ON "PropertyDamage"("driverId");

-- CreateIndex
CREATE INDEX "PropertyDamage_damageDate_idx" ON "PropertyDamage"("damageDate");

-- CreateIndex
CREATE UNIQUE INDEX "LossRun_documentId_key" ON "LossRun"("documentId");

-- CreateIndex
CREATE INDEX "LossRun_companyId_idx" ON "LossRun"("companyId");

-- CreateIndex
CREATE INDEX "LossRun_reportType_idx" ON "LossRun"("reportType");

-- CreateIndex
CREATE INDEX "LossRun_reportDate_idx" ON "LossRun"("reportDate");

-- CreateIndex
CREATE INDEX "SafetyMeeting_companyId_idx" ON "SafetyMeeting"("companyId");

-- CreateIndex
CREATE INDEX "SafetyMeeting_meetingDate_idx" ON "SafetyMeeting"("meetingDate");

-- CreateIndex
CREATE INDEX "MeetingAttendance_meetingId_idx" ON "MeetingAttendance"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAttendance_driverId_idx" ON "MeetingAttendance"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_meetingId_driverId_key" ON "MeetingAttendance"("meetingId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPolicy_documentId_key" ON "SafetyPolicy"("documentId");

-- CreateIndex
CREATE INDEX "SafetyPolicy_companyId_idx" ON "SafetyPolicy"("companyId");

-- CreateIndex
CREATE INDEX "SafetyPolicy_category_idx" ON "SafetyPolicy"("category");

-- CreateIndex
CREATE INDEX "SafetyPolicy_effectiveDate_idx" ON "SafetyPolicy"("effectiveDate");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_policyId_idx" ON "PolicyAcknowledgment"("policyId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_driverId_idx" ON "PolicyAcknowledgment"("driverId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_status_idx" ON "PolicyAcknowledgment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAcknowledgment_policyId_driverId_key" ON "PolicyAcknowledgment"("policyId", "driverId");

-- CreateIndex
CREATE INDEX "SafetyCampaign_companyId_idx" ON "SafetyCampaign"("companyId");

-- CreateIndex
CREATE INDEX "SafetyCampaign_startDate_idx" ON "SafetyCampaign"("startDate");

-- CreateIndex
CREATE INDEX "SafetyCampaign_endDate_idx" ON "SafetyCampaign"("endDate");

-- CreateIndex
CREATE INDEX "CampaignParticipant_campaignId_idx" ON "CampaignParticipant"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_driverId_idx" ON "CampaignParticipant"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignParticipant_campaignId_driverId_key" ON "CampaignParticipant"("campaignId", "driverId");

-- CreateIndex
CREATE INDEX "SafetyRecognition_companyId_idx" ON "SafetyRecognition"("companyId");

-- CreateIndex
CREATE INDEX "SafetyRecognition_driverId_idx" ON "SafetyRecognition"("driverId");

-- CreateIndex
CREATE INDEX "SafetyRecognition_recognitionDate_idx" ON "SafetyRecognition"("recognitionDate");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMaterial_documentId_key" ON "TrainingMaterial"("documentId");

-- CreateIndex
CREATE INDEX "TrainingMaterial_companyId_idx" ON "TrainingMaterial"("companyId");

-- CreateIndex
CREATE INDEX "TrainingMaterial_category_idx" ON "TrainingMaterial"("category");

-- CreateIndex
CREATE INDEX "TrainingMaterial_materialType_idx" ON "TrainingMaterial"("materialType");

-- CreateIndex
CREATE INDEX "ComplianceAlert_companyId_idx" ON "ComplianceAlert"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceAlert_alertType_idx" ON "ComplianceAlert"("alertType");

-- CreateIndex
CREATE INDEX "ComplianceAlert_status_idx" ON "ComplianceAlert"("status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_assignedTo_idx" ON "ComplianceAlert"("assignedTo");

-- CreateIndex
CREATE INDEX "ComplianceAlert_createdAt_idx" ON "ComplianceAlert"("createdAt");

-- CreateIndex
CREATE INDEX "_DocumentToInvestigation_B_index" ON "_DocumentToInvestigation"("B");

-- CreateIndex
CREATE INDEX "_DocumentToRoadsideInspection_B_index" ON "_DocumentToRoadsideInspection"("B");

-- CreateIndex
CREATE INDEX "_DocumentToInsuranceClaim_B_index" ON "_DocumentToInsuranceClaim"("B");

-- CreateIndex
CREATE INDEX "_AnnualReviewToDocument_B_index" ON "_AnnualReviewToDocument"("B");

-- CreateIndex
CREATE INDEX "_DVIRToDocument_B_index" ON "_DVIRToDocument"("B");

-- CreateIndex
CREATE INDEX "_ComplianceReviewToDocument_B_index" ON "_ComplianceReviewToDocument"("B");

-- CreateIndex
CREATE INDEX "_CargoClaimToDocument_B_index" ON "_CargoClaimToDocument"("B");

-- CreateIndex
CREATE INDEX "Breakdown_trailerId_idx" ON "Breakdown"("trailerId");

-- CreateIndex
CREATE INDEX "Classification_mcNumberId_idx" ON "Classification"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "Classification_companyId_mcNumberId_type_name_key" ON "Classification"("companyId", "mcNumberId", "type", "name");

-- CreateIndex
CREATE INDEX "Customer_creditHold_idx" ON "Customer"("creditHold");

-- CreateIndex
CREATE INDEX "Customer_factoringCompanyId_idx" ON "Customer"("factoringCompanyId");

-- CreateIndex
CREATE INDEX "DefaultConfiguration_mcNumberId_idx" ON "DefaultConfiguration"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultConfiguration_companyId_mcNumberId_category_key_key" ON "DefaultConfiguration"("companyId", "mcNumberId", "category", "key");

-- CreateIndex
CREATE INDEX "DocumentTemplate_mcNumberId_idx" ON "DocumentTemplate"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_companyId_mcNumberId_name_key" ON "DocumentTemplate"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "DynamicStatus_mcNumberId_idx" ON "DynamicStatus"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicStatus_companyId_mcNumberId_entityType_name_key" ON "DynamicStatus"("companyId", "mcNumberId", "entityType", "name");

-- CreateIndex
CREATE INDEX "ExpenseCategory_mcNumberId_idx" ON "ExpenseCategory"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_companyId_mcNumberId_name_key" ON "ExpenseCategory"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "ExpenseType_mcNumberId_idx" ON "ExpenseType"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_companyId_mcNumberId_name_key" ON "ExpenseType"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "Invoice_factoringStatus_idx" ON "Invoice"("factoringStatus");

-- CreateIndex
CREATE INDEX "Invoice_factoringCompanyId_idx" ON "Invoice"("factoringCompanyId");

-- CreateIndex
CREATE INDEX "Invoice_paymentMethod_idx" ON "Invoice"("paymentMethod");

-- CreateIndex
CREATE INDEX "Invoice_subStatus_idx" ON "Invoice"("subStatus");

-- CreateIndex
CREATE INDEX "InvoiceBatch_factoringCompanyId_idx" ON "InvoiceBatch"("factoringCompanyId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_companyId_idx" ON "MaintenanceRecord"("companyId");

-- CreateIndex
CREATE INDEX "NetProfitFormula_mcNumberId_idx" ON "NetProfitFormula"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "NetProfitFormula_companyId_mcNumberId_name_key" ON "NetProfitFormula"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "OrderPaymentType_mcNumberId_idx" ON "OrderPaymentType"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPaymentType_companyId_mcNumberId_name_key" ON "OrderPaymentType"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "PaymentConfiguration_mcNumberId_idx" ON "PaymentConfiguration"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfiguration_companyId_mcNumberId_paymentType_key" ON "PaymentConfiguration"("companyId", "mcNumberId", "paymentType");

-- CreateIndex
CREATE INDEX "ReportConstructor_mcNumberId_idx" ON "ReportConstructor"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportConstructor_companyId_mcNumberId_name_key" ON "ReportConstructor"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "ReportTemplate_mcNumberId_idx" ON "ReportTemplate"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_companyId_mcNumberId_name_key" ON "ReportTemplate"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "SafetyConfiguration_mcNumberId_idx" ON "SafetyConfiguration"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyConfiguration_companyId_mcNumberId_category_key_key" ON "SafetyConfiguration"("companyId", "mcNumberId", "category", "key");

-- CreateIndex
CREATE INDEX "Settlement_periodStart_idx" ON "Settlement"("periodStart");

-- CreateIndex
CREATE INDEX "Settlement_periodEnd_idx" ON "Settlement"("periodEnd");

-- CreateIndex
CREATE INDEX "Tariff_mcNumberId_idx" ON "Tariff"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_companyId_mcNumberId_name_key" ON "Tariff"("companyId", "mcNumberId", "name");

-- CreateIndex
CREATE INDEX "WorkOrderType_mcNumberId_idx" ON "WorkOrderType"("mcNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderType_companyId_mcNumberId_name_key" ON "WorkOrderType"("companyId", "mcNumberId", "name");

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallShift" ADD CONSTRAINT "OnCallShift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallShift" ADD CONSTRAINT "OnCallShift_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallShift" ADD CONSTRAINT "OnCallShift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breakdown" ADD CONSTRAINT "Breakdown_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Trailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shortPayApprovedById_fkey" FOREIGN KEY ("shortPayApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_writtenOffById_fkey" FOREIGN KEY ("writtenOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDeduction" ADD CONSTRAINT "SettlementDeduction_fuelEntryId_fkey" FOREIGN KEY ("fuelEntryId") REFERENCES "FuelEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringCompany" ADD CONSTRAINT "FactoringCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfirmation" ADD CONSTRAINT "RateConfirmation_matchedById_fkey" FOREIGN KEY ("matchedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationFile" ADD CONSTRAINT "DriverQualificationFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationFile" ADD CONSTRAINT "DriverQualificationFile_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DQFDocument" ADD CONSTRAINT "DQFDocument_dqfId_fkey" FOREIGN KEY ("dqfId") REFERENCES "DriverQualificationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DQFDocument" ADD CONSTRAINT "DQFDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCard" ADD CONSTRAINT "MedicalCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCard" ADD CONSTRAINT "MedicalCard_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCard" ADD CONSTRAINT "MedicalCard_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CDLRecord" ADD CONSTRAINT "CDLRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CDLRecord" ADD CONSTRAINT "CDLRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CDLRecord" ADD CONSTRAINT "CDLRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRRecord" ADD CONSTRAINT "MVRRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRRecord" ADD CONSTRAINT "MVRRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRRecord" ADD CONSTRAINT "MVRRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MVRViolation" ADD CONSTRAINT "MVRViolation_mvrRecordId_fkey" FOREIGN KEY ("mvrRecordId") REFERENCES "MVRRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugAlcoholTest" ADD CONSTRAINT "DrugAlcoholTest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugAlcoholTest" ADD CONSTRAINT "DrugAlcoholTest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugAlcoholTest" ADD CONSTRAINT "DrugAlcoholTest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPool" ADD CONSTRAINT "TestingPool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPoolDriver" ADD CONSTRAINT "TestingPoolDriver_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "TestingPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPoolDriver" ADD CONSTRAINT "TestingPoolDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelection" ADD CONSTRAINT "RandomSelection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelection" ADD CONSTRAINT "RandomSelection_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "TestingPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelectedDriver" ADD CONSTRAINT "RandomSelectedDriver_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "RandomSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomSelectedDriver" ADD CONSTRAINT "RandomSelectedDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMCSAClearinghouseQuery" ADD CONSTRAINT "FMCSAClearinghouseQuery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMCSAClearinghouseQuery" ADD CONSTRAINT "FMCSAClearinghouseQuery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOSViolation" ADD CONSTRAINT "HOSViolation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOSViolation" ADD CONSTRAINT "HOSViolation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ELDProvider" ADD CONSTRAINT "ELDProvider_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ELDSyncLog" ADD CONSTRAINT "ELDSyncLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ELDProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReview" ADD CONSTRAINT "AnnualReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReview" ADD CONSTRAINT "AnnualReview_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIR" ADD CONSTRAINT "DVIR_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIR" ADD CONSTRAINT "DVIR_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIR" ADD CONSTRAINT "DVIR_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVIRDefect" ADD CONSTRAINT "DVIRDefect_dvirId_fkey" FOREIGN KEY ("dvirId") REFERENCES "DVIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideInspection" ADD CONSTRAINT "RoadsideInspection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideInspection" ADD CONSTRAINT "RoadsideInspection_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideInspection" ADD CONSTRAINT "RoadsideInspection_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadsideViolation" ADD CONSTRAINT "RoadsideViolation_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "RoadsideInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfServiceOrder" ADD CONSTRAINT "OutOfServiceOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfServiceOrder" ADD CONSTRAINT "OutOfServiceOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfServiceOrder" ADD CONSTRAINT "OutOfServiceOrder_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentPhoto" ADD CONSTRAINT "AccidentPhoto_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentPhoto" ADD CONSTRAINT "AccidentPhoto_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventableDetermination" ADD CONSTRAINT "PreventableDetermination_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventableDetermination" ADD CONSTRAINT "PreventableDetermination_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventableVote" ADD CONSTRAINT "PreventableVote_determinationId_fkey" FOREIGN KEY ("determinationId") REFERENCES "PreventableDetermination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMiss" ADD CONSTRAINT "NearMiss_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMiss" ADD CONSTRAINT "NearMiss_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearMiss" ADD CONSTRAINT "NearMiss_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessStatement" ADD CONSTRAINT "WitnessStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessStatement" ADD CONSTRAINT "WitnessStatement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessStatement" ADD CONSTRAINT "WitnessStatement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CSAScore" ADD CONSTRAINT "CSAScore_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMCSACompliance" ADD CONSTRAINT "FMCSACompliance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceReview" ADD CONSTRAINT "ComplianceReview_complianceId_fkey" FOREIGN KEY ("complianceId") REFERENCES "FMCSACompliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceActionItem" ADD CONSTRAINT "ComplianceActionItem_complianceId_fkey" FOREIGN KEY ("complianceId") REFERENCES "FMCSACompliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQSubmission" ADD CONSTRAINT "DataQSubmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQSubmission" ADD CONSTRAINT "DataQSubmission_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "RoadsideViolation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCertificate" ADD CONSTRAINT "InsuranceCertificate_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "InsurancePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCertificate" ADD CONSTRAINT "InsuranceCertificate_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoClaim" ADD CONSTRAINT "CargoClaim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoClaim" ADD CONSTRAINT "CargoClaim_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDamage" ADD CONSTRAINT "PropertyDamage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDamage" ADD CONSTRAINT "PropertyDamage_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDamage" ADD CONSTRAINT "PropertyDamage_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LossRun" ADD CONSTRAINT "LossRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LossRun" ADD CONSTRAINT "LossRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyMeeting" ADD CONSTRAINT "SafetyMeeting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SafetyMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPolicy" ADD CONSTRAINT "SafetyPolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPolicy" ADD CONSTRAINT "SafetyPolicy_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "SafetyPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCampaign" ADD CONSTRAINT "SafetyCampaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SafetyCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyRecognition" ADD CONSTRAINT "SafetyRecognition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyRecognition" ADD CONSTRAINT "SafetyRecognition_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMaterial" ADD CONSTRAINT "TrainingMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingMaterial" ADD CONSTRAINT "TrainingMaterial_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentConfiguration" ADD CONSTRAINT "PaymentConfiguration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentType" ADD CONSTRAINT "OrderPaymentType_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicStatus" ADD CONSTRAINT "DynamicStatus_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultConfiguration" ADD CONSTRAINT "DefaultConfiguration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderType" ADD CONSTRAINT "WorkOrderType_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyConfiguration" ADD CONSTRAINT "SafetyConfiguration_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportConstructor" ADD CONSTRAINT "ReportConstructor_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetProfitFormula" ADD CONSTRAINT "NetProfitFormula_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInvestigation" ADD CONSTRAINT "_DocumentToInvestigation_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInvestigation" ADD CONSTRAINT "_DocumentToInvestigation_B_fkey" FOREIGN KEY ("B") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToRoadsideInspection" ADD CONSTRAINT "_DocumentToRoadsideInspection_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToRoadsideInspection" ADD CONSTRAINT "_DocumentToRoadsideInspection_B_fkey" FOREIGN KEY ("B") REFERENCES "RoadsideInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInsuranceClaim" ADD CONSTRAINT "_DocumentToInsuranceClaim_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToInsuranceClaim" ADD CONSTRAINT "_DocumentToInsuranceClaim_B_fkey" FOREIGN KEY ("B") REFERENCES "InsuranceClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnualReviewToDocument" ADD CONSTRAINT "_AnnualReviewToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "AnnualReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnualReviewToDocument" ADD CONSTRAINT "_AnnualReviewToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DVIRToDocument" ADD CONSTRAINT "_DVIRToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "DVIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DVIRToDocument" ADD CONSTRAINT "_DVIRToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComplianceReviewToDocument" ADD CONSTRAINT "_ComplianceReviewToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "ComplianceReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComplianceReviewToDocument" ADD CONSTRAINT "_ComplianceReviewToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CargoClaimToDocument" ADD CONSTRAINT "_CargoClaimToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "CargoClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CargoClaimToDocument" ADD CONSTRAINT "_CargoClaimToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
