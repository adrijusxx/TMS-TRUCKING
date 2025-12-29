-- Add invoiceBatchId column to Invoice table
-- This column provides a direct reference to InvoiceBatch for easier querying

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "invoiceBatchId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_invoiceBatchId_idx" ON "Invoice"("invoiceBatchId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_invoiceBatchId_fkey" FOREIGN KEY ("invoiceBatchId") REFERENCES "InvoiceBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;























