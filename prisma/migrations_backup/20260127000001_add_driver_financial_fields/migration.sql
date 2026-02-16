-- Add perDiem column to Driver table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Driver' 
        AND column_name = 'perDiem'
    ) THEN
        ALTER TABLE "Driver" ADD COLUMN "perDiem" DOUBLE PRECISION;
    END IF;
END $$;

-- Add escrowTargetAmount column to Driver table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Driver' 
        AND column_name = 'escrowTargetAmount'
    ) THEN
        ALTER TABLE "Driver" ADD COLUMN "escrowTargetAmount" DOUBLE PRECISION;
    END IF;
END $$;

-- Add escrowDeductionPerWeek column to Driver table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Driver' 
        AND column_name = 'escrowDeductionPerWeek'
    ) THEN
        ALTER TABLE "Driver" ADD COLUMN "escrowDeductionPerWeek" DOUBLE PRECISION;
    END IF;
END $$;





























