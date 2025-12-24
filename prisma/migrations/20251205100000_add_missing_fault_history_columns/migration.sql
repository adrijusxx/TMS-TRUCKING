-- Add missing columns to TruckFaultHistory table
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "samsaraVehicleId" TEXT;
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "spnId" INTEGER;
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "fmiId" INTEGER;
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "checkEngineLight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "mileageAtOccur" DOUBLE PRECISION;
ALTER TABLE "TruckFaultHistory" ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT;

-- Create unique constraint for deduplication (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'TruckFaultHistory_truckId_faultCode_occurredAt_key'
    ) THEN
        ALTER TABLE "TruckFaultHistory" 
        ADD CONSTRAINT "TruckFaultHistory_truckId_faultCode_occurredAt_key" 
        UNIQUE ("truckId", "faultCode", "occurredAt");
    END IF;
END $$;

-- Create index for category column
CREATE INDEX IF NOT EXISTS "TruckFaultHistory_category_idx" ON "TruckFaultHistory"("category");





















