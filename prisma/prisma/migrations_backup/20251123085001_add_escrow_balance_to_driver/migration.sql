-- Add escrowBalance column to Driver table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Driver' 
        AND column_name = 'escrowBalance'
    ) THEN
        ALTER TABLE "Driver" ADD COLUMN "escrowBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add advanceLimit column to Driver table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Driver' 
        AND column_name = 'advanceLimit'
    ) THEN
        ALTER TABLE "Driver" ADD COLUMN "advanceLimit" DOUBLE PRECISION NOT NULL DEFAULT 1000;
    END IF;
END $$;





