-- Migration: Make MC Number Mandatory for Drivers, Trucks, Trailers, and Users
-- This migration converts mcNumber string fields to mcNumberId relation fields

-- Step 1: Add new mcNumberId columns as nullable
ALTER TABLE "Driver" ADD COLUMN "mcNumberId_temp" TEXT;
ALTER TABLE "Truck" ADD COLUMN "mcNumberId_temp" TEXT;
ALTER TABLE "Trailer" ADD COLUMN "mcNumberId_temp" TEXT;

-- Step 2: Migrate existing mcNumber string values to mcNumberId
-- For Drivers: Match mcNumber strings to McNumber records
UPDATE "Driver" d
SET "mcNumberId_temp" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."number" = TRIM(d."mcNumber")
    AND mn."companyId" = d."companyId"
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE d."mcNumber" IS NOT NULL 
  AND TRIM(d."mcNumber") != '';

-- For Trucks: Match mcNumber strings to McNumber records
UPDATE "Truck" t
SET "mcNumberId_temp" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."number" = TRIM(t."mcNumber")
    AND mn."companyId" = t."companyId"
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE t."mcNumber" IS NOT NULL 
  AND TRIM(t."mcNumber") != '';

-- For Trailers: Match mcNumber strings to McNumber records
UPDATE "Trailer" tr
SET "mcNumberId_temp" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."number" = TRIM(tr."mcNumber")
    AND mn."companyId" = tr."companyId"
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE tr."mcNumber" IS NOT NULL 
  AND TRIM(tr."mcNumber") != '';

-- Step 3: For records without matching MC numbers, use the default MC number for the company
-- Drivers
UPDATE "Driver" d
SET "mcNumberId_temp" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."companyId" = d."companyId"
    AND mn."isDefault" = true
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE d."mcNumberId_temp" IS NULL;

-- Trucks
UPDATE "Truck" t
SET "mcNumberId_temp" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."companyId" = t."companyId"
    AND mn."isDefault" = true
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE t."mcNumberId_temp" IS NULL;

-- Trailers
UPDATE "Trailer" tr
SET "mcNumberId_temp" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."companyId" = tr."companyId"
    AND mn."isDefault" = true
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE tr."mcNumberId_temp" IS NULL;

-- Step 4: For Users without mcNumberId, sync from Driver record if DRIVER role, or use default MC
UPDATE "User" u
SET "mcNumberId" = (
  SELECT d."mcNumberId_temp"
  FROM "Driver" d
  WHERE d."userId" = u.id
  LIMIT 1
)
WHERE u."mcNumberId" IS NULL 
  AND u.role = 'DRIVER'
  AND EXISTS (SELECT 1 FROM "Driver" d WHERE d."userId" = u.id);

-- For non-DRIVER users, use default MC number
UPDATE "User" u
SET "mcNumberId" = (
  SELECT mn.id
  FROM "McNumber" mn
  WHERE mn."companyId" = u."companyId"
    AND mn."isDefault" = true
    AND mn."deletedAt" IS NULL
  LIMIT 1
)
WHERE u."mcNumberId" IS NULL 
  AND u.role != 'DRIVER';

-- Step 5: Drop old columns and rename temp columns
ALTER TABLE "Driver" DROP COLUMN "mcNumber";
ALTER TABLE "Truck" DROP COLUMN "mcNumber";
ALTER TABLE "Trailer" DROP COLUMN "mcNumber";

ALTER TABLE "Driver" RENAME COLUMN "mcNumberId_temp" TO "mcNumberId";
ALTER TABLE "Truck" RENAME COLUMN "mcNumberId_temp" TO "mcNumberId";
ALTER TABLE "Trailer" RENAME COLUMN "mcNumberId_temp" TO "mcNumberId";

-- Step 6: Make columns required (NOT NULL)
ALTER TABLE "Driver" ALTER COLUMN "mcNumberId" SET NOT NULL;
ALTER TABLE "Truck" ALTER COLUMN "mcNumberId" SET NOT NULL;
ALTER TABLE "Trailer" ALTER COLUMN "mcNumberId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "mcNumberId" SET NOT NULL;

-- Step 7: Add foreign key constraints
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_mcNumberId_fkey" FOREIGN KEY ("mcNumberId") REFERENCES "McNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Add indexes
CREATE INDEX IF NOT EXISTS "Driver_mcNumberId_idx" ON "Driver"("mcNumberId");
CREATE INDEX IF NOT EXISTS "Driver_companyId_mcNumberId_idx" ON "Driver"("companyId", "mcNumberId");
CREATE INDEX IF NOT EXISTS "Truck_mcNumberId_idx" ON "Truck"("mcNumberId");
CREATE INDEX IF NOT EXISTS "Truck_companyId_mcNumberId_idx" ON "Truck"("companyId", "mcNumberId");
CREATE INDEX IF NOT EXISTS "Trailer_mcNumberId_idx" ON "Trailer"("mcNumberId");
CREATE INDEX IF NOT EXISTS "Trailer_companyId_mcNumberId_idx" ON "Trailer"("companyId", "mcNumberId");

-- Step 9: Drop old indexes that referenced mcNumber string
DROP INDEX IF EXISTS "Driver_mcNumber_idx";
DROP INDEX IF EXISTS "Driver_companyId_mcNumber_idx";
DROP INDEX IF EXISTS "Truck_mcNumber_idx";
DROP INDEX IF EXISTS "Truck_companyId_mcNumber_idx";





