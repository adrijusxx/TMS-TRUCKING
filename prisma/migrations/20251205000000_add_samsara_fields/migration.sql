-- Add Samsara Integration fields to Truck table
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "samsaraId" TEXT;
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "samsaraSyncedAt" TIMESTAMP(3);
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "samsaraSyncStatus" TEXT;
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "lastOdometerReading" DOUBLE PRECISION;
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "lastOdometerUpdate" TIMESTAMP(3);
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "lastEngineHours" DOUBLE PRECISION;

-- Add Samsara Integration fields to Trailer table
ALTER TABLE "Trailer" ADD COLUMN IF NOT EXISTS "samsaraId" TEXT;
ALTER TABLE "Trailer" ADD COLUMN IF NOT EXISTS "samsaraSyncedAt" TIMESTAMP(3);
ALTER TABLE "Trailer" ADD COLUMN IF NOT EXISTS "samsaraSyncStatus" TEXT;

-- Create unique constraints for samsaraId
CREATE UNIQUE INDEX IF NOT EXISTS "Truck_samsaraId_key" ON "Truck"("samsaraId");
CREATE UNIQUE INDEX IF NOT EXISTS "Trailer_samsaraId_key" ON "Trailer"("samsaraId");

-- Create indexes for samsaraId
CREATE INDEX IF NOT EXISTS "Truck_samsaraId_idx" ON "Truck"("samsaraId");
CREATE INDEX IF NOT EXISTS "Trailer_samsaraId_idx" ON "Trailer"("samsaraId");

