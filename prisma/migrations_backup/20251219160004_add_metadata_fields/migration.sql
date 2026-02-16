-- AlterTable: Add metadata JSONB column to all entities for migration field storage
-- This allows storing unmapped fields from third-party TMS imports

-- Core Operations
ALTER TABLE "Load" ADD COLUMN "metadata" JSONB;
ALTER TABLE "LoadStop" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "LoadTemplate" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Driver" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Truck" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Trailer" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Customer" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Vendor" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Location" ADD COLUMN "metadata" JSONB;

-- Accounting & Financial (CRITICAL)
ALTER TABLE "Invoice" ADD COLUMN "metadata" JSONB;
ALTER TABLE "InvoiceBatch" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Settlement" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "SettlementDeduction" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "DriverAdvance" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "DriverNegativeBalance" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "LoadExpense" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Payment" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Reconciliation" ADD COLUMN "metadata" JSONB;
ALTER TABLE "FactoringCompany" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "FactoringBatch" ADD COLUMN "metadata" JSONB;
ALTER TABLE "AccessorialCharge" ADD COLUMN "metadata" JSONB;
ALTER TABLE "RateConfirmation" ADD COLUMN "metadata" JSONB;

-- Maintenance & Fleet
ALTER TABLE "FuelEntry" ADD COLUMN "metadata" JSONB;
ALTER TABLE "MaintenanceRecord" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Breakdown" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "Inspection" ADD COLUMN "metadata" JSONB;

-- Safety & Compliance
ALTER TABLE "SafetyIncident" ADD COLUMN "metadata" JSONB;
-- ALTER TABLE "SafetyTraining" ADD COLUMN "metadata" JSONB;
ALTER TABLE "DVIR" ADD COLUMN "metadata" JSONB;
ALTER TABLE "RoadsideInspection" ADD COLUMN "metadata" JSONB;
ALTER TABLE "DrugAlcoholTest" ADD COLUMN "metadata" JSONB;
ALTER TABLE "MVRRecord" ADD COLUMN "metadata" JSONB;

-- Other Important Entities
ALTER TABLE "Document" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Communication" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Project" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Task" ADD COLUMN "metadata" JSONB;

-- Create GIN indexes for efficient metadata queries on critical entities
CREATE INDEX "Load_metadata_idx" ON "Load" USING GIN ("metadata");
CREATE INDEX "Driver_metadata_idx" ON "Driver" USING GIN ("metadata");
CREATE INDEX "Invoice_metadata_idx" ON "Invoice" USING GIN ("metadata");
CREATE INDEX "Settlement_metadata_idx" ON "Settlement" USING GIN ("metadata");
CREATE INDEX "Payment_metadata_idx" ON "Payment" USING GIN ("metadata");
CREATE INDEX "Customer_metadata_idx" ON "Customer" USING GIN ("metadata");
CREATE INDEX "Truck_metadata_idx" ON "Truck" USING GIN ("metadata");








