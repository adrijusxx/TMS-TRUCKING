-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "mcNumberId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_mcNumberId_idx" ON "Invoice"("mcNumberId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
