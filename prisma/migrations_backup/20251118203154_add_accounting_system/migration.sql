-- CreateEnum
CREATE TYPE "BatchPostStatus" AS ENUM ('UNPOSTED', 'POSTED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('NOT_RECONCILED', 'PARTIALLY_RECONCILED', 'FULLY_RECONCILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoiceStatus" ADD VALUE 'INVOICED';
ALTER TYPE "InvoiceStatus" ADD VALUE 'POSTED';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceNote" TEXT,
ADD COLUMN     "loadId" TEXT,
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "paymentNote" TEXT,
ADD COLUMN     "reconciliationStatus" "ReconciliationStatus" NOT NULL DEFAULT 'NOT_RECONCILED',
ADD COLUMN     "subStatus" TEXT;

-- CreateTable
CREATE TABLE "InvoiceBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "postStatus" "BatchPostStatus" NOT NULL DEFAULT 'UNPOSTED',
    "mcNumber" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "sentToFactoringAt" TIMESTAMP(3),
    "factoringCompany" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT,
    "reconciledAmount" DOUBLE PRECISION NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL,
    "reconciledById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatch_batchNumber_key" ON "InvoiceBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "InvoiceBatch_companyId_idx" ON "InvoiceBatch"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceBatch_postStatus_idx" ON "InvoiceBatch"("postStatus");

-- CreateIndex
CREATE INDEX "InvoiceBatch_batchNumber_idx" ON "InvoiceBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "InvoiceBatch_createdById_idx" ON "InvoiceBatch"("createdById");

-- CreateIndex
CREATE INDEX "InvoiceBatchItem_batchId_idx" ON "InvoiceBatchItem"("batchId");

-- CreateIndex
CREATE INDEX "InvoiceBatchItem_invoiceId_idx" ON "InvoiceBatchItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatchItem_batchId_invoiceId_key" ON "InvoiceBatchItem"("batchId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_paymentNumber_idx" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_createdById_idx" ON "Payment"("createdById");

-- CreateIndex
CREATE INDEX "Reconciliation_invoiceId_idx" ON "Reconciliation"("invoiceId");

-- CreateIndex
CREATE INDEX "Reconciliation_paymentId_idx" ON "Reconciliation"("paymentId");

-- CreateIndex
CREATE INDEX "Reconciliation_reconciledAt_idx" ON "Reconciliation"("reconciledAt");

-- CreateIndex
CREATE INDEX "Reconciliation_reconciledById_idx" ON "Reconciliation"("reconciledById");

-- CreateIndex
CREATE INDEX "Invoice_mcNumber_idx" ON "Invoice"("mcNumber");

-- CreateIndex
CREATE INDEX "Invoice_reconciliationStatus_idx" ON "Invoice"("reconciliationStatus");

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatchItem" ADD CONSTRAINT "InvoiceBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InvoiceBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatchItem" ADD CONSTRAINT "InvoiceBatchItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
