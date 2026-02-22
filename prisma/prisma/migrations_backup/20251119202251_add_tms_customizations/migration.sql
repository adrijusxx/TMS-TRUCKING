-- CreateEnum
CREATE TYPE "TariffType" AS ENUM ('RATE_PER_MILE', 'RATE_PER_LOAD', 'RATE_PER_POUND', 'FLAT_RATE', 'PERCENTAGE', 'FUEL_SURCHARGE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('LOAD', 'DRIVER', 'TRUCK', 'TRAILER', 'INVOICE', 'CUSTOMER', 'VENDOR', 'SETTLEMENT', 'BREAKDOWN', 'INSPECTION', 'SAFETY_INCIDENT');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LOADS', 'DRIVERS', 'FINANCIAL', 'SAFETY', 'MAINTENANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'HTML');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ClassificationType" AS ENUM ('EQUIPMENT', 'COMMODITY', 'SERVICE_TYPE', 'CUSTOMER_SEGMENT', 'COST_CENTER', 'CUSTOM');

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadTag" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverTag" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckTag" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TruckTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceTag" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "defaultAmount" DOUBLE PRECISION,
    "isReimbursable" BOOLEAN NOT NULL DEFAULT true,
    "requiresReceipt" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "type" "TariffType" NOT NULL DEFAULT 'RATE_PER_MILE',
    "rate" DOUBLE PRECISION NOT NULL,
    "minimumRate" DOUBLE PRECISION,
    "perStop" DOUBLE PRECISION,
    "perPound" DOUBLE PRECISION,
    "perMile" DOUBLE PRECISION,
    "fuelSurcharge" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffRule" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "defaultMethod" "PaymentMethod",
    "defaultTerms" INTEGER,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "approvalThreshold" DOUBLE PRECISION,
    "requiresPO" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPaymentType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "terms" INTEGER,
    "requiresPO" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OrderPaymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicStatus" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workflowRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DynamicStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DefaultConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "category" TEXT,
    "defaultPriority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedHours" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "description" TEXT,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "template" JSONB NOT NULL,
    "fields" JSONB,
    "filters" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportConstructor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "EntityType" NOT NULL,
    "layout" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "filters" JSONB,
    "grouping" JSONB,
    "sorting" JSONB,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportConstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetProfitFormula" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NetProfitFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "ClassificationType" NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Classification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_companyId_idx" ON "Tag"("companyId");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_companyId_name_key" ON "Tag"("companyId", "name");

-- CreateIndex
CREATE INDEX "LoadTag_loadId_idx" ON "LoadTag"("loadId");

-- CreateIndex
CREATE INDEX "LoadTag_tagId_idx" ON "LoadTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "LoadTag_loadId_tagId_key" ON "LoadTag"("loadId", "tagId");

-- CreateIndex
CREATE INDEX "DriverTag_driverId_idx" ON "DriverTag"("driverId");

-- CreateIndex
CREATE INDEX "DriverTag_tagId_idx" ON "DriverTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverTag_driverId_tagId_key" ON "DriverTag"("driverId", "tagId");

-- CreateIndex
CREATE INDEX "TruckTag_truckId_idx" ON "TruckTag"("truckId");

-- CreateIndex
CREATE INDEX "TruckTag_tagId_idx" ON "TruckTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TruckTag_truckId_tagId_key" ON "TruckTag"("truckId", "tagId");

-- CreateIndex
CREATE INDEX "CustomerTag_customerId_idx" ON "CustomerTag"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTag_tagId_idx" ON "CustomerTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_customerId_tagId_key" ON "CustomerTag"("customerId", "tagId");

-- CreateIndex
CREATE INDEX "InvoiceTag_invoiceId_idx" ON "InvoiceTag"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceTag_tagId_idx" ON "InvoiceTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceTag_invoiceId_tagId_key" ON "InvoiceTag"("invoiceId", "tagId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_companyId_idx" ON "ExpenseCategory"("companyId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_parentId_idx" ON "ExpenseCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_companyId_name_key" ON "ExpenseCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "ExpenseType_companyId_idx" ON "ExpenseType"("companyId");

-- CreateIndex
CREATE INDEX "ExpenseType_categoryId_idx" ON "ExpenseType"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_companyId_name_key" ON "ExpenseType"("companyId", "name");

-- CreateIndex
CREATE INDEX "Tariff_companyId_idx" ON "Tariff"("companyId");

-- CreateIndex
CREATE INDEX "Tariff_type_idx" ON "Tariff"("type");

-- CreateIndex
CREATE INDEX "Tariff_isDefault_idx" ON "Tariff"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_companyId_name_key" ON "Tariff"("companyId", "name");

-- CreateIndex
CREATE INDEX "TariffRule_tariffId_idx" ON "TariffRule"("tariffId");

-- CreateIndex
CREATE INDEX "TariffRule_priority_idx" ON "TariffRule"("priority");

-- CreateIndex
CREATE INDEX "PaymentConfiguration_companyId_idx" ON "PaymentConfiguration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfiguration_companyId_paymentType_key" ON "PaymentConfiguration"("companyId", "paymentType");

-- CreateIndex
CREATE INDEX "OrderPaymentType_companyId_idx" ON "OrderPaymentType"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPaymentType_companyId_name_key" ON "OrderPaymentType"("companyId", "name");

-- CreateIndex
CREATE INDEX "DynamicStatus_companyId_idx" ON "DynamicStatus"("companyId");

-- CreateIndex
CREATE INDEX "DynamicStatus_entityType_idx" ON "DynamicStatus"("entityType");

-- CreateIndex
CREATE INDEX "DynamicStatus_order_idx" ON "DynamicStatus"("order");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicStatus_companyId_entityType_name_key" ON "DynamicStatus"("companyId", "entityType", "name");

-- CreateIndex
CREATE INDEX "DocumentTemplate_companyId_idx" ON "DocumentTemplate"("companyId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_type_idx" ON "DocumentTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_companyId_name_key" ON "DocumentTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "DefaultConfiguration_companyId_idx" ON "DefaultConfiguration"("companyId");

-- CreateIndex
CREATE INDEX "DefaultConfiguration_category_idx" ON "DefaultConfiguration"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultConfiguration_companyId_category_key_key" ON "DefaultConfiguration"("companyId", "category", "key");

-- CreateIndex
CREATE INDEX "WorkOrderType_companyId_idx" ON "WorkOrderType"("companyId");

-- CreateIndex
CREATE INDEX "WorkOrderType_category_idx" ON "WorkOrderType"("category");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderType_companyId_name_key" ON "WorkOrderType"("companyId", "name");

-- CreateIndex
CREATE INDEX "SafetyConfiguration_companyId_idx" ON "SafetyConfiguration"("companyId");

-- CreateIndex
CREATE INDEX "SafetyConfiguration_category_idx" ON "SafetyConfiguration"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyConfiguration_companyId_category_key_key" ON "SafetyConfiguration"("companyId", "category", "key");

-- CreateIndex
CREATE INDEX "ReportTemplate_companyId_idx" ON "ReportTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ReportTemplate_type_idx" ON "ReportTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_companyId_name_key" ON "ReportTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "ReportConstructor_companyId_idx" ON "ReportConstructor"("companyId");

-- CreateIndex
CREATE INDEX "ReportConstructor_entityType_idx" ON "ReportConstructor"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "ReportConstructor_companyId_name_key" ON "ReportConstructor"("companyId", "name");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_assignedToId_idx" ON "Project"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_companyId_name_key" ON "Project"("companyId", "name");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "NetProfitFormula_companyId_idx" ON "NetProfitFormula"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "NetProfitFormula_companyId_name_key" ON "NetProfitFormula"("companyId", "name");

-- CreateIndex
CREATE INDEX "Classification_companyId_idx" ON "Classification"("companyId");

-- CreateIndex
CREATE INDEX "Classification_type_idx" ON "Classification"("type");

-- CreateIndex
CREATE INDEX "Classification_parentId_idx" ON "Classification"("parentId");

-- CreateIndex
CREATE INDEX "Classification_order_idx" ON "Classification"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Classification_companyId_type_name_key" ON "Classification"("companyId", "type", "name");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTag" ADD CONSTRAINT "LoadTag_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTag" ADD CONSTRAINT "LoadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTag" ADD CONSTRAINT "DriverTag_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTag" ADD CONSTRAINT "DriverTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckTag" ADD CONSTRAINT "TruckTag_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckTag" ADD CONSTRAINT "TruckTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTag" ADD CONSTRAINT "InvoiceTag_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTag" ADD CONSTRAINT "InvoiceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentConfiguration" ADD CONSTRAINT "PaymentConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentType" ADD CONSTRAINT "OrderPaymentType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicStatus" ADD CONSTRAINT "DynamicStatus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultConfiguration" ADD CONSTRAINT "DefaultConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderType" ADD CONSTRAINT "WorkOrderType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyConfiguration" ADD CONSTRAINT "SafetyConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportConstructor" ADD CONSTRAINT "ReportConstructor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetProfitFormula" ADD CONSTRAINT "NetProfitFormula_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Classification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
