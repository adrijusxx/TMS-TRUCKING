-- AlterTable
-- Add detention configuration fields to Customer table
-- These fields allow customers to have custom detention rates and free time hours

DO $$
BEGIN
    -- Add detentionFreeTimeHours column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Customer' 
        AND column_name = 'detentionFreeTimeHours'
    ) THEN
        ALTER TABLE "Customer" ADD COLUMN "detentionFreeTimeHours" DOUBLE PRECISION;
    END IF;

    -- Add detentionRate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Customer' 
        AND column_name = 'detentionRate'
    ) THEN
        ALTER TABLE "Customer" ADD COLUMN "detentionRate" DOUBLE PRECISION;
    END IF;
END $$;

