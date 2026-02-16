-- CreateEnum
CREATE TYPE "DetentionStartStrategy" AS ENUM ('ARRIVAL', 'APPOINTMENT');

-- AlterEnum (Add new values to LoadStatus enum)
ALTER TYPE "LoadStatus" ADD VALUE 'BILLING_HOLD';
ALTER TYPE "LoadStatus" ADD VALUE 'READY_TO_BILL';

-- AlterTable: Add billing hold fields to Load
ALTER TABLE "Load" ADD COLUMN     "isBillingHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Load" ADD COLUMN     "billingHoldReason" TEXT;
ALTER TABLE "Load" ADD COLUMN     "detentionStartStrategy" "DetentionStartStrategy";

-- AlterTable: Add detention calculation fields to LoadStop
ALTER TABLE "LoadStop" ADD COLUMN     "billableDetentionMinutes" INTEGER DEFAULT 0;
ALTER TABLE "LoadStop" ADD COLUMN     "detentionClockStart" TIMESTAMP(3);

-- CreateIndex: Add index on isBillingHold for faster queries
CREATE INDEX "Load_isBillingHold_idx" ON "Load"("isBillingHold");

-- CreateIndex: Add index on detentionClockStart for detention queries
CREATE INDEX "LoadStop_detentionClockStart_idx" ON "LoadStop"("detentionClockStart");





























