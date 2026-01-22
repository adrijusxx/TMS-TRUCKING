-- Add metadata column to Lead table for CRM import data storage
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Create GIN index for efficient metadata queries
CREATE INDEX IF NOT EXISTS "Lead_metadata_idx" ON "Lead" USING GIN ("metadata");
