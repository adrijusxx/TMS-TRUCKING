-- Migration: Company-Scoped Unique Constraints
-- This migration converts global @unique constraints to company-scoped @@unique constraints
-- to allow multiple companies to have entities with the same identifiers

-- IMPORTANT: Run this on the production database after verifying no duplicates exist

-- Step 1: Drop existing unique constraints
-- Note: The constraint names may differ based on your database - check with \d tablename in psql

-- Load
ALTER TABLE "Load" DROP CONSTRAINT IF EXISTS "Load_loadNumber_key";

-- Driver
ALTER TABLE "Driver" DROP CONSTRAINT IF EXISTS "Driver_driverNumber_key";

-- Truck
ALTER TABLE "Truck" DROP CONSTRAINT IF EXISTS "Truck_truckNumber_key";
ALTER TABLE "Truck" DROP CONSTRAINT IF EXISTS "Truck_vin_key";

-- Trailer
ALTER TABLE "Trailer" DROP CONSTRAINT IF EXISTS "Trailer_trailerNumber_key";
ALTER TABLE "Trailer" DROP CONSTRAINT IF EXISTS "Trailer_vin_key";

-- MaintenanceRecord
ALTER TABLE "MaintenanceRecord" DROP CONSTRAINT IF EXISTS "MaintenanceRecord_maintenanceNumber_key";

-- Breakdown
ALTER TABLE "Breakdown" DROP CONSTRAINT IF EXISTS "Breakdown_breakdownNumber_key";

-- Communication
ALTER TABLE "Communication" DROP CONSTRAINT IF EXISTS "Communication_ticketNumber_key";

-- Customer
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_customerNumber_key";

-- Invoice
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_invoiceNumber_key";

-- InvoiceBatch
ALTER TABLE "InvoiceBatch" DROP CONSTRAINT IF EXISTS "InvoiceBatch_batchNumber_key";

-- Inspection
ALTER TABLE "Inspection" DROP CONSTRAINT IF EXISTS "Inspection_inspectionNumber_key";

-- InventoryItem
ALTER TABLE "InventoryItem" DROP CONSTRAINT IF EXISTS "InventoryItem_itemNumber_key";

-- Vendor
ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_vendorNumber_key";

-- Location
ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_locationNumber_key";


-- Step 2: Create new company-scoped unique constraints

-- Load
CREATE UNIQUE INDEX IF NOT EXISTS "Load_companyId_loadNumber_key" ON "Load"("companyId", "loadNumber");

-- Driver
CREATE UNIQUE INDEX IF NOT EXISTS "Driver_companyId_driverNumber_key" ON "Driver"("companyId", "driverNumber");

-- Truck
CREATE UNIQUE INDEX IF NOT EXISTS "Truck_companyId_truckNumber_key" ON "Truck"("companyId", "truckNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Truck_companyId_vin_key" ON "Truck"("companyId", "vin");

-- Trailer
CREATE UNIQUE INDEX IF NOT EXISTS "Trailer_companyId_trailerNumber_key" ON "Trailer"("companyId", "trailerNumber");
-- Note: vin is nullable, so we need to handle nulls
CREATE UNIQUE INDEX IF NOT EXISTS "Trailer_companyId_vin_key" ON "Trailer"("companyId", "vin") WHERE "vin" IS NOT NULL;

-- MaintenanceRecord
CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceRecord_companyId_maintenanceNumber_key" ON "MaintenanceRecord"("companyId", "maintenanceNumber") WHERE "maintenanceNumber" IS NOT NULL;

-- Breakdown
CREATE UNIQUE INDEX IF NOT EXISTS "Breakdown_companyId_breakdownNumber_key" ON "Breakdown"("companyId", "breakdownNumber");

-- Communication
CREATE UNIQUE INDEX IF NOT EXISTS "Communication_companyId_ticketNumber_key" ON "Communication"("companyId", "ticketNumber") WHERE "ticketNumber" IS NOT NULL;

-- Customer
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_companyId_customerNumber_key" ON "Customer"("companyId", "customerNumber");

-- Invoice
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");

-- InvoiceBatch
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceBatch_companyId_batchNumber_key" ON "InvoiceBatch"("companyId", "batchNumber");

-- Inspection
CREATE UNIQUE INDEX IF NOT EXISTS "Inspection_companyId_inspectionNumber_key" ON "Inspection"("companyId", "inspectionNumber");

-- InventoryItem
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_companyId_itemNumber_key" ON "InventoryItem"("companyId", "itemNumber");

-- Vendor
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_companyId_vendorNumber_key" ON "Vendor"("companyId", "vendorNumber");

-- Location (nullable field)
CREATE UNIQUE INDEX IF NOT EXISTS "Location_companyId_locationNumber_key" ON "Location"("companyId", "locationNumber") WHERE "locationNumber" IS NOT NULL;

-- Done!
-- After running this migration, customers can import data with the same identifiers (load numbers, etc.)
-- without conflicts, as long as they are in different companies.
