-- Add customerId column to InvoiceBatch table
-- This column provides an optional primary customer reference for filtering

-- AlterTable
ALTER TABLE "InvoiceBatch" ADD COLUMN "customerId" TEXT;

-- CreateIndex
CREATE INDEX "InvoiceBatch_customerId_idx" ON "InvoiceBatch"("customerId");

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;























