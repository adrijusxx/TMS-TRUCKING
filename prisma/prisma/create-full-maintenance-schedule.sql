-- Create MaintenanceSchedule with full schema to match Prisma model
-- First create the enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "MaintenanceType" AS ENUM ('PM_A', 'PM_B', 'TIRES', 'REPAIR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the table with all required columns from schema line 1284
CREATE TABLE IF NOT EXISTS "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "intervalMiles" INTEGER NOT NULL DEFAULT 0,
    "intervalMonths" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "MaintenanceSchedule_truckId_idx" ON "MaintenanceSchedule"("truckId");
CREATE INDEX IF NOT EXISTS "MaintenanceSchedule_companyId_idx" ON "MaintenanceSchedule"("companyId");

-- Add foreign keys (only if they don't exist)
DO $$ BEGIN
    ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_truckId_fkey" 
        FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
