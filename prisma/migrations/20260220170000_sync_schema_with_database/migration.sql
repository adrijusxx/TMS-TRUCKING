-- Migration: sync_schema_with_database
-- Description: Captures all schema changes applied via `prisma db push` that were
--              never recorded as migrations. This brings the migration history in sync
--              with the current schema so production (RDS) can be updated.
--
-- All statements use idempotent guards (IF NOT EXISTS, DO blocks with exception handling)
-- so this migration is safe to run on databases that already have some or all of these objects.

-- ============================================
-- 1. NEW ENUMS (7 enums)
-- ============================================

-- PermissionOverrideType
DO $$ BEGIN
  CREATE TYPE "PermissionOverrideType" AS ENUM ('GRANT', 'REVOKE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OnboardingStatus
DO $$ BEGIN
  CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- StepStatus
DO $$ BEGIN
  CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OnboardingStepType
DO $$ BEGIN
  CREATE TYPE "OnboardingStepType" AS ENUM (
    'DOCUMENT_UPLOAD', 'FORM_COMPLETION', 'BACKGROUND_CHECK', 'DRUG_TEST',
    'MEDICAL_CARD', 'MVR_CHECK', 'EQUIPMENT_ASSIGNMENT', 'TRAINING',
    'ORIENTATION', 'POLICY_ACKNOWLEDGMENT', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CampaignStatus
DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CampaignChannel
DO $$ BEGIN
  CREATE TYPE "CampaignChannel" AS ENUM ('SMS', 'EMAIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CampaignRecipientStatus
DO $$ BEGIN
  CREATE TYPE "CampaignRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'OPTED_OUT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. ENUM VALUE ADDITIONS (existing enums)
-- ============================================

-- IntegrationProvider: add NETSAPIENS
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'NETSAPIENS';

-- LeadActivityType: add HIRED, ONBOARDING_STARTED
ALTER TYPE "LeadActivityType" ADD VALUE IF NOT EXISTS 'HIRED';
ALTER TYPE "LeadActivityType" ADD VALUE IF NOT EXISTS 'ONBOARDING_STARTED';

-- LeadSource: add APPLICATION
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'APPLICATION';

-- NotificationType: add LEAD_FOLLOW_UP_DUE, LEAD_SLA_ALERT, LEAD_NEW_APPLICATION
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAD_FOLLOW_UP_DUE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAD_SLA_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAD_NEW_APPLICATION';

-- ============================================
-- 3. NEW TABLES (20 tables)
-- ============================================

-- 3.1 Role (custom roles v2)
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "parentRoleId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- 3.2 RolePermissionEntry
CREATE TABLE IF NOT EXISTS "RolePermissionEntry" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermissionEntry_pkey" PRIMARY KEY ("id")
);

-- 3.3 UserPermissionOverride
CREATE TABLE IF NOT EXISTS "UserPermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "type" "PermissionOverrideType" NOT NULL,
    "reason" TEXT,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- 3.4 PermissionGroup
CREATE TABLE IF NOT EXISTS "PermissionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionGroup_pkey" PRIMARY KEY ("id")
);

-- 3.5 PermissionGroupItem
CREATE TABLE IF NOT EXISTS "PermissionGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "PermissionGroupItem_pkey" PRIMARY KEY ("id")
);

-- 3.6 RolePermissionGroup
CREATE TABLE IF NOT EXISTS "RolePermissionGroup" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "RolePermissionGroup_pkey" PRIMARY KEY ("id")
);

-- 3.7 CrmSyncLog
CREATE TABLE IF NOT EXISTS "CrmSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rowsProcessed" INTEGER NOT NULL DEFAULT 0,
    "rowsCreated" INTEGER NOT NULL DEFAULT 0,
    "rowsUpdated" INTEGER NOT NULL DEFAULT 0,
    "rowsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "duration" INTEGER,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmSyncLog_pkey" PRIMARY KEY ("id")
);

-- 3.8 OnboardingChecklist
CREATE TABLE IF NOT EXISTS "OnboardingChecklist" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- 3.9 OnboardingStep
CREATE TABLE IF NOT EXISTS "OnboardingStep" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "stepType" "OnboardingStepType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- 3.10 OnboardingTemplate
CREATE TABLE IF NOT EXISTS "OnboardingTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

-- 3.11 OnboardingTemplateStep
CREATE TABLE IF NOT EXISTS "OnboardingTemplateStep" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stepType" "OnboardingStepType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplateStep_pkey" PRIMARY KEY ("id")
);

-- 3.12 RecruitingSLAConfig
CREATE TABLE IF NOT EXISTS "RecruitingSLAConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitingSLAConfig_pkey" PRIMARY KEY ("id")
);

-- 3.13 RecruiterProfile
CREATE TABLE IF NOT EXISTS "RecruiterProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "maxCapacity" INTEGER NOT NULL DEFAULT 50,
    "lastAssignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterProfile_pkey" PRIMARY KEY ("id")
);

-- 3.14 RecruiterAssignmentConfig
CREATE TABLE IF NOT EXISTS "RecruiterAssignmentConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "strategy" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "assignOnSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterAssignmentConfig_pkey" PRIMARY KEY ("id")
);

-- 3.15 MessageTemplate
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- 3.16 Campaign
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" "CampaignChannel" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceFilter" JSONB,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "isDrip" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- 3.17 CampaignStep
CREATE TABLE IF NOT EXISTS "CampaignStep" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayHours" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

-- 3.18 CampaignRecipient
CREATE TABLE IF NOT EXISTS "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "nextSendAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- 3.19 CampaignStepExecution
CREATE TABLE IF NOT EXISTS "CampaignStepExecution" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignStepExecution_pkey" PRIMARY KEY ("id")
);

-- 3.20 AutomationRule
CREATE TABLE IF NOT EXISTS "AutomationRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channel" "CampaignChannel" NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" JSONB NOT NULL,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 4. COLUMN ADDITIONS (existing tables)
-- ============================================

-- 4.1 Company.slug (unique, nullable)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- 4.2 CrmIntegration.syncInterval (nullable, default 15)
ALTER TABLE "CrmIntegration" ADD COLUMN IF NOT EXISTS "syncInterval" INTEGER DEFAULT 15;

-- 4.3 DeductionRule.mcNumberId (nullable FK)
ALTER TABLE "DeductionRule" ADD COLUMN IF NOT EXISTS "mcNumberId" TEXT;

-- 4.4 Lead — new columns
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastCallAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastSmsAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextFollowUpDate" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextFollowUpNote" TEXT;

-- 4.5 LoadStop — geocoding columns
ALTER TABLE "LoadStop" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "LoadStop" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "LoadStop" ADD COLUMN IF NOT EXISTS "geocodedAt" TIMESTAMP(3);

-- 4.6 Settlement — new columns
ALTER TABLE "Settlement" ADD COLUMN IF NOT EXISTS "carriedForwardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Settlement" ADD COLUMN IF NOT EXISTS "calculationHistory" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- 4.7 SettlementDeduction.category — make required with default
-- The column already exists (nullable TEXT). We need to:
--   a) Set default for future inserts
--   b) Backfill existing NULL values
--   c) Make NOT NULL
DO $$ BEGIN
  -- Set default
  ALTER TABLE "SettlementDeduction" ALTER COLUMN "category" SET DEFAULT 'deduction';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Backfill NULLs
UPDATE "SettlementDeduction" SET "category" = 'deduction' WHERE "category" IS NULL;

-- Make NOT NULL (idempotent — if already NOT NULL, Postgres just does nothing harmful,
-- but to be safe we wrap in DO block)
DO $$ BEGIN
  ALTER TABLE "SettlementDeduction" ALTER COLUMN "category" SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4.8 User.roleId (nullable FK to Role)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT;

-- 4.9 UserCompany.roleId (nullable FK to Role)
ALTER TABLE "UserCompany" ADD COLUMN IF NOT EXISTS "roleId" TEXT;

-- ============================================
-- 5. UNIQUE INDEXES (new tables + new columns)
-- ============================================

-- Role
CREATE UNIQUE INDEX IF NOT EXISTS "Role_slug_companyId_key" ON "Role"("slug", "companyId");

-- RolePermissionEntry
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermissionEntry_roleId_permission_key" ON "RolePermissionEntry"("roleId", "permission");

-- UserPermissionOverride
CREATE UNIQUE INDEX IF NOT EXISTS "UserPermissionOverride_userId_permission_key" ON "UserPermissionOverride"("userId", "permission");

-- PermissionGroup
CREATE UNIQUE INDEX IF NOT EXISTS "PermissionGroup_name_companyId_key" ON "PermissionGroup"("name", "companyId");

-- PermissionGroupItem
CREATE UNIQUE INDEX IF NOT EXISTS "PermissionGroupItem_groupId_permission_key" ON "PermissionGroupItem"("groupId", "permission");

-- RolePermissionGroup
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermissionGroup_roleId_groupId_key" ON "RolePermissionGroup"("roleId", "groupId");

-- OnboardingChecklist (driverId unique, leadId unique)
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingChecklist_driverId_key" ON "OnboardingChecklist"("driverId");
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingChecklist_leadId_key" ON "OnboardingChecklist"("leadId");

-- OnboardingTemplate
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingTemplate_companyId_name_key" ON "OnboardingTemplate"("companyId", "name");

-- RecruitingSLAConfig
CREATE UNIQUE INDEX IF NOT EXISTS "RecruitingSLAConfig_companyId_status_key" ON "RecruitingSLAConfig"("companyId", "status");

-- RecruiterProfile (userId unique)
CREATE UNIQUE INDEX IF NOT EXISTS "RecruiterProfile_userId_key" ON "RecruiterProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "RecruiterProfile_companyId_userId_key" ON "RecruiterProfile"("companyId", "userId");

-- RecruiterAssignmentConfig (companyId unique)
CREATE UNIQUE INDEX IF NOT EXISTS "RecruiterAssignmentConfig_companyId_key" ON "RecruiterAssignmentConfig"("companyId");

-- MessageTemplate
CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_companyId_name_key" ON "MessageTemplate"("companyId", "name");

-- CampaignRecipient
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignRecipient_campaignId_leadId_key" ON "CampaignRecipient"("campaignId", "leadId");

-- CampaignStepExecution
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignStepExecution_recipientId_stepId_key" ON "CampaignStepExecution"("recipientId", "stepId");

-- Lead.driverId unique
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_driverId_key" ON "Lead"("driverId");

-- Company.slug unique
CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug");

-- ============================================
-- 6. REGULAR INDEXES
-- ============================================

-- Role indexes
CREATE INDEX IF NOT EXISTS "Role_companyId_idx" ON "Role"("companyId");
CREATE INDEX IF NOT EXISTS "Role_parentRoleId_idx" ON "Role"("parentRoleId");

-- RolePermissionEntry indexes
CREATE INDEX IF NOT EXISTS "RolePermissionEntry_roleId_idx" ON "RolePermissionEntry"("roleId");

-- UserPermissionOverride indexes
CREATE INDEX IF NOT EXISTS "UserPermissionOverride_userId_idx" ON "UserPermissionOverride"("userId");

-- PermissionGroup indexes
CREATE INDEX IF NOT EXISTS "PermissionGroup_companyId_idx" ON "PermissionGroup"("companyId");

-- PermissionGroupItem indexes
CREATE INDEX IF NOT EXISTS "PermissionGroupItem_groupId_idx" ON "PermissionGroupItem"("groupId");

-- CrmSyncLog indexes
CREATE INDEX IF NOT EXISTS "CrmSyncLog_integrationId_idx" ON "CrmSyncLog"("integrationId");
CREATE INDEX IF NOT EXISTS "CrmSyncLog_createdAt_idx" ON "CrmSyncLog"("createdAt");

-- OnboardingChecklist indexes
CREATE INDEX IF NOT EXISTS "OnboardingChecklist_companyId_idx" ON "OnboardingChecklist"("companyId");
CREATE INDEX IF NOT EXISTS "OnboardingChecklist_status_idx" ON "OnboardingChecklist"("status");

-- OnboardingStep indexes
CREATE INDEX IF NOT EXISTS "OnboardingStep_checklistId_idx" ON "OnboardingStep"("checklistId");
CREATE INDEX IF NOT EXISTS "OnboardingStep_status_idx" ON "OnboardingStep"("status");

-- OnboardingTemplate indexes
CREATE INDEX IF NOT EXISTS "OnboardingTemplate_companyId_idx" ON "OnboardingTemplate"("companyId");

-- OnboardingTemplateStep indexes
CREATE INDEX IF NOT EXISTS "OnboardingTemplateStep_templateId_idx" ON "OnboardingTemplateStep"("templateId");

-- RecruitingSLAConfig indexes
CREATE INDEX IF NOT EXISTS "RecruitingSLAConfig_companyId_idx" ON "RecruitingSLAConfig"("companyId");

-- RecruiterProfile indexes
CREATE INDEX IF NOT EXISTS "RecruiterProfile_companyId_idx" ON "RecruiterProfile"("companyId");
CREATE INDEX IF NOT EXISTS "RecruiterProfile_isActive_idx" ON "RecruiterProfile"("isActive");

-- RecruiterAssignmentConfig indexes
CREATE INDEX IF NOT EXISTS "RecruiterAssignmentConfig_companyId_idx" ON "RecruiterAssignmentConfig"("companyId");

-- MessageTemplate indexes
CREATE INDEX IF NOT EXISTS "MessageTemplate_companyId_idx" ON "MessageTemplate"("companyId");
CREATE INDEX IF NOT EXISTS "MessageTemplate_channel_idx" ON "MessageTemplate"("channel");

-- Campaign indexes
CREATE INDEX IF NOT EXISTS "Campaign_companyId_idx" ON "Campaign"("companyId");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "Campaign_companyId_status_idx" ON "Campaign"("companyId", "status");

-- CampaignStep indexes
CREATE INDEX IF NOT EXISTS "CampaignStep_campaignId_idx" ON "CampaignStep"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignStep_sortOrder_idx" ON "CampaignStep"("sortOrder");

-- CampaignRecipient indexes
CREATE INDEX IF NOT EXISTS "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignRecipient_leadId_idx" ON "CampaignRecipient"("leadId");
CREATE INDEX IF NOT EXISTS "CampaignRecipient_status_idx" ON "CampaignRecipient"("status");
CREATE INDEX IF NOT EXISTS "CampaignRecipient_nextSendAt_idx" ON "CampaignRecipient"("nextSendAt");

-- CampaignStepExecution indexes
CREATE INDEX IF NOT EXISTS "CampaignStepExecution_recipientId_idx" ON "CampaignStepExecution"("recipientId");
CREATE INDEX IF NOT EXISTS "CampaignStepExecution_stepId_idx" ON "CampaignStepExecution"("stepId");
CREATE INDEX IF NOT EXISTS "CampaignStepExecution_status_idx" ON "CampaignStepExecution"("status");

-- AutomationRule indexes
CREATE INDEX IF NOT EXISTS "AutomationRule_companyId_idx" ON "AutomationRule"("companyId");
CREATE INDEX IF NOT EXISTS "AutomationRule_enabled_idx" ON "AutomationRule"("enabled");
CREATE INDEX IF NOT EXISTS "AutomationRule_triggerType_idx" ON "AutomationRule"("triggerType");

-- Lead new column indexes
CREATE INDEX IF NOT EXISTS "Lead_nextFollowUpDate_idx" ON "Lead"("nextFollowUpDate");
CREATE INDEX IF NOT EXISTS "Lead_assignedToId_nextFollowUpDate_idx" ON "Lead"("assignedToId", "nextFollowUpDate");
CREATE INDEX IF NOT EXISTS "Lead_lastCallAt_idx" ON "Lead"("lastCallAt");
CREATE INDEX IF NOT EXISTS "Lead_lastSmsAt_idx" ON "Lead"("lastSmsAt");

-- DeductionRule.mcNumberId index
CREATE INDEX IF NOT EXISTS "DeductionRule_mcNumberId_idx" ON "DeductionRule"("mcNumberId");

-- User.roleId index
CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");

-- UserCompany.roleId index
CREATE INDEX IF NOT EXISTS "UserCompany_roleId_idx" ON "UserCompany"("roleId");

-- ============================================
-- 7. FOREIGN KEYS
-- ============================================
-- Foreign keys don't support IF NOT EXISTS, so we use DO blocks
-- with exception handling to skip if constraint already exists.

-- Role FKs
DO $$ BEGIN
  ALTER TABLE "Role" ADD CONSTRAINT "Role_parentRoleId_fkey"
    FOREIGN KEY ("parentRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RolePermissionEntry FK
DO $$ BEGIN
  ALTER TABLE "RolePermissionEntry" ADD CONSTRAINT "RolePermissionEntry_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UserPermissionOverride FK
DO $$ BEGIN
  ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PermissionGroup FK
DO $$ BEGIN
  ALTER TABLE "PermissionGroup" ADD CONSTRAINT "PermissionGroup_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PermissionGroupItem FK
DO $$ BEGIN
  ALTER TABLE "PermissionGroupItem" ADD CONSTRAINT "PermissionGroupItem_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "PermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RolePermissionGroup FKs
DO $$ BEGIN
  ALTER TABLE "RolePermissionGroup" ADD CONSTRAINT "RolePermissionGroup_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RolePermissionGroup" ADD CONSTRAINT "RolePermissionGroup_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "PermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CrmSyncLog FK
DO $$ BEGIN
  ALTER TABLE "CrmSyncLog" ADD CONSTRAINT "CrmSyncLog_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "CrmIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OnboardingChecklist FKs
DO $$ BEGIN
  ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OnboardingStep FKs
DO $$ BEGIN
  ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_checklistId_fkey"
    FOREIGN KEY ("checklistId") REFERENCES "OnboardingChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_completedById_fkey"
    FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OnboardingTemplate FK
DO $$ BEGIN
  ALTER TABLE "OnboardingTemplate" ADD CONSTRAINT "OnboardingTemplate_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OnboardingTemplateStep FK
DO $$ BEGIN
  ALTER TABLE "OnboardingTemplateStep" ADD CONSTRAINT "OnboardingTemplateStep_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RecruitingSLAConfig FK
DO $$ BEGIN
  ALTER TABLE "RecruitingSLAConfig" ADD CONSTRAINT "RecruitingSLAConfig_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RecruiterProfile FKs
DO $$ BEGIN
  ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RecruiterAssignmentConfig FK
DO $$ BEGIN
  ALTER TABLE "RecruiterAssignmentConfig" ADD CONSTRAINT "RecruiterAssignmentConfig_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- MessageTemplate FKs
DO $$ BEGIN
  ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Campaign FKs
DO $$ BEGIN
  ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CampaignStep FKs
DO $$ BEGIN
  ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CampaignRecipient FKs
DO $$ BEGIN
  ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CampaignStepExecution FKs
DO $$ BEGIN
  ALTER TABLE "CampaignStepExecution" ADD CONSTRAINT "CampaignStepExecution_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CampaignStepExecution" ADD CONSTRAINT "CampaignStepExecution_stepId_fkey"
    FOREIGN KEY ("stepId") REFERENCES "CampaignStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AutomationRule FKs
DO $$ BEGIN
  ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lead.driverId FK to Driver
DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DeductionRule.mcNumberId FK to McNumber
DO $$ BEGIN
  ALTER TABLE "DeductionRule" ADD CONSTRAINT "DeductionRule_mcNumberId_fkey"
    FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User.roleId FK to Role
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UserCompany.roleId FK to Role
DO $$ BEGIN
  ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
