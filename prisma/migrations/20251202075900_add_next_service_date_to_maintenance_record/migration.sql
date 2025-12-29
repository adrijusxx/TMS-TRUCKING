-- AlterTable
ALTER TABLE "MaintenanceRecord" ADD COLUMN "nextServiceDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MaintenanceRecord_nextServiceDate_idx" ON "MaintenanceRecord"("nextServiceDate");























