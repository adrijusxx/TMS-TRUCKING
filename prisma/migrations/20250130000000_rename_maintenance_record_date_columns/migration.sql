-- ============================================
-- Migration: Update MaintenanceRecord schema
-- Adds: date, vendorId, status, nextServiceDate
-- Removes: scheduledDate, completedDate, vendor
-- ============================================

-- Step 1: Check if mileage column exists and rename to odometer if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'mileage'
    ) THEN
        ALTER TABLE "MaintenanceRecord" RENAME COLUMN "mileage" TO "odometer";
    END IF;
END $$;

-- Step 2: Add date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'date'
    ) THEN
        ALTER TABLE "MaintenanceRecord" ADD COLUMN "date" TIMESTAMP(3);
    END IF;
END $$;

-- Step 3: Migrate data from completedDate to date (preferred)
UPDATE "MaintenanceRecord"
SET "date" = "completedDate"
WHERE "completedDate" IS NOT NULL 
  AND "date" IS NULL
  AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'MaintenanceRecord' AND column_name = 'completedDate'
  );

-- Step 4: Migrate data from scheduledDate to date (fallback for records without completedDate)
UPDATE "MaintenanceRecord"
SET "date" = "scheduledDate"
WHERE "scheduledDate" IS NOT NULL 
  AND "date" IS NULL
  AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'MaintenanceRecord' AND column_name = 'scheduledDate'
  );

-- Step 5: Set date to createdAt for any remaining records without a date
UPDATE "MaintenanceRecord"
SET "date" = "createdAt"
WHERE "date" IS NULL;

-- Step 6: Make date column NOT NULL (only if it's currently nullable)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' 
        AND column_name = 'date' 
        AND is_nullable = 'YES'
    ) THEN
        -- First ensure all records have a date
        UPDATE "MaintenanceRecord" SET "date" = COALESCE("date", "createdAt") WHERE "date" IS NULL;
        -- Then set NOT NULL
        ALTER TABLE "MaintenanceRecord" ALTER COLUMN "date" SET NOT NULL;
    END IF;
END $$;

-- Step 7: Create index on date column if it doesn't exist
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_date_idx" ON "MaintenanceRecord"("date");

-- Step 8: Add nextServiceDate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'nextServiceDate'
    ) THEN
        ALTER TABLE "MaintenanceRecord" ADD COLUMN "nextServiceDate" TIMESTAMP(3);
    END IF;
END $$;

-- Step 9: Create index on nextServiceDate if it doesn't exist
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_nextServiceDate_idx" ON "MaintenanceRecord"("nextServiceDate");

-- Step 10: Create MaintenanceRecordStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaintenanceRecordStatus') THEN
        CREATE TYPE "MaintenanceRecordStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 11: Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'status'
    ) THEN
        ALTER TABLE "MaintenanceRecord" ADD COLUMN "status" "MaintenanceRecordStatus" DEFAULT 'OPEN';
        -- Update existing records to have a status
        UPDATE "MaintenanceRecord" SET "status" = 'COMPLETED' WHERE "status" IS NULL;
    END IF;
END $$;

-- Step 12: Create index on status if it doesn't exist
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");

-- Step 13: Ensure companyId exists and is populated
DO $$
BEGIN
    -- Add companyId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'companyId'
    ) THEN
        ALTER TABLE "MaintenanceRecord" ADD COLUMN "companyId" TEXT;
        
        -- Update companyId from truck's companyId (only where truck exists)
        UPDATE "MaintenanceRecord" mr
        SET "companyId" = t."companyId"
        FROM "Truck" t
        WHERE mr."truckId" = t."id"
          AND mr."companyId" IS NULL;
        
        -- For any remaining records without companyId, set a default (shouldn't happen, but safety)
        UPDATE "MaintenanceRecord"
        SET "companyId" = (
            SELECT "id" FROM "Company" LIMIT 1
        )
        WHERE "companyId" IS NULL
          AND EXISTS (SELECT 1 FROM "Company" LIMIT 1);
        
        -- Make companyId NOT NULL if we have values
        IF EXISTS (SELECT 1 FROM "MaintenanceRecord" WHERE "companyId" IS NOT NULL) THEN
            ALTER TABLE "MaintenanceRecord" ALTER COLUMN "companyId" SET NOT NULL;
        END IF;
    ELSE
        -- If companyId exists but is nullable, ensure it's populated
        UPDATE "MaintenanceRecord" mr
        SET "companyId" = t."companyId"
        FROM "Truck" t
        WHERE mr."truckId" = t."id"
          AND mr."companyId" IS NULL;
    END IF;
END $$;

-- Step 14: Create index on companyId if it doesn't exist
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_companyId_idx" ON "MaintenanceRecord"("companyId");

-- Step 15: Add vendorId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'vendorId'
    ) THEN
        ALTER TABLE "MaintenanceRecord" ADD COLUMN "vendorId" TEXT;
    END IF;
END $$;

-- Step 16: Create index on vendorId if it doesn't exist
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_vendorId_idx" ON "MaintenanceRecord"("vendorId");

-- Step 17: Add foreign key constraint for vendorId if Vendor table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Vendor') THEN
        -- Drop constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'MaintenanceRecord_vendorId_fkey'
        ) THEN
            ALTER TABLE "MaintenanceRecord" DROP CONSTRAINT "MaintenanceRecord_vendorId_fkey";
        END IF;
        
        -- Add foreign key constraint
        ALTER TABLE "MaintenanceRecord" 
        ADD CONSTRAINT "MaintenanceRecord_vendorId_fkey" 
        FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN
        -- Log error but continue (constraint might already exist or Vendor table structure might differ)
        RAISE NOTICE 'Could not add vendorId foreign key constraint: %', SQLERRM;
END $$;

-- Step 18: Drop old columns safely
DO $$
BEGIN
    -- Drop scheduledDate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'scheduledDate'
    ) THEN
        ALTER TABLE "MaintenanceRecord" DROP COLUMN "scheduledDate";
    END IF;
    
    -- Drop completedDate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'completedDate'
    ) THEN
        ALTER TABLE "MaintenanceRecord" DROP COLUMN "completedDate";
    END IF;
    
    -- Drop vendor (text column, replaced by vendorId)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MaintenanceRecord' AND column_name = 'vendor'
    ) THEN
        ALTER TABLE "MaintenanceRecord" DROP COLUMN "vendor";
    END IF;
END $$;

-- Step 19: Drop old indexes safely
DROP INDEX IF EXISTS "MaintenanceRecord_scheduledDate_idx";
DROP INDEX IF EXISTS "MaintenanceRecord_completedDate_idx";

-- Step 20: Add foreign key constraint for companyId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'MaintenanceRecord_companyId_fkey'
        AND table_name = 'MaintenanceRecord'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Company') THEN
            ALTER TABLE "MaintenanceRecord" 
            ADD CONSTRAINT "MaintenanceRecord_companyId_fkey" 
            FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add companyId foreign key constraint: %', SQLERRM;
END $$;

-- Step 21: Add foreign key constraint for truckId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'MaintenanceRecord_truckId_fkey'
        AND table_name = 'MaintenanceRecord'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Truck') THEN
            ALTER TABLE "MaintenanceRecord" 
            ADD CONSTRAINT "MaintenanceRecord_truckId_fkey" 
            FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add truckId foreign key constraint: %', SQLERRM;
END $$;
