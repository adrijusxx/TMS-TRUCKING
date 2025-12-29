-- Create FactoringBatchStatus enum
CREATE TYPE "FactoringBatchStatus" AS ENUM ('PENDING', 'SUBMITTED', 'FUNDED', 'COMPLETED');

-- CreateTable: FactoringBatch
CREATE TABLE "FactoringBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "FactoringBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FactoringBatch_companyId_idx" ON "FactoringBatch"("companyId");
CREATE INDEX "FactoringBatch_vendorId_idx" ON "FactoringBatch"("vendorId");
CREATE INDEX "FactoringBatch_status_idx" ON "FactoringBatch"("status");

-- AddForeignKey
ALTER TABLE "FactoringBatch" ADD CONSTRAINT "FactoringBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FactoringBatch" ADD CONSTRAINT "FactoringBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add factoringBatchId column to Invoice table
-- This column links invoices to their factoring batches
ALTER TABLE "Invoice" ADD COLUMN "factoringBatchId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_factoringBatchId_idx" ON "Invoice"("factoringBatchId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_factoringBatchId_fkey" FOREIGN KEY ("factoringBatchId") REFERENCES "FactoringBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

