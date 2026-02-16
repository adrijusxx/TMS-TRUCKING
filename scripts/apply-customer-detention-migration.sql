-- Add detention configuration fields to Customer table
-- This migration adds the missing fields that are defined in the Prisma schema
-- but don't exist in the database yet

ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS "detentionFreeTimeHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "detentionRate" DOUBLE PRECISION;





























