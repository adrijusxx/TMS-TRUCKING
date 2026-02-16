-- AlterTable: Add vendorId and reimbursable fields to LoadExpense
-- Migration to update LoadExpense to use Vendor relation instead of vendor text field

DO $$
BEGIN
    -- Add vendorId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LoadExpense' 
        AND column_name = 'vendorId'
    ) THEN
        ALTER TABLE "LoadExpense" ADD COLUMN "vendorId" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "LoadExpense" 
        ADD CONSTRAINT "LoadExpense_vendorId_fkey" 
        FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL;
    END IF;

    -- Add reimbursable column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LoadExpense' 
        AND column_name = 'reimbursable'
    ) THEN
        ALTER TABLE "LoadExpense" ADD COLUMN "reimbursable" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Create index on vendorId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'LoadExpense' 
        AND indexname = 'LoadExpense_vendorId_idx'
    ) THEN
        CREATE INDEX "LoadExpense_vendorId_idx" ON "LoadExpense"("vendorId");
    END IF;
END $$;



























