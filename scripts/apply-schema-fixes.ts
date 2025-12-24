#!/usr/bin/env tsx
/**
 * Apply schema fixes for missing database columns
 * 
 * This script applies migrations to add missing columns that exist in the Prisma schema
 * but don't exist in the database yet.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applySchemaFixes() {
  try {
    console.log('🔧 Applying schema fixes...\n');

    // Fix 1: Add Customer detention fields
    console.log('1. Adding Customer detention fields...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            -- Add detentionFreeTimeHours column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Customer' 
                AND column_name = 'detentionFreeTimeHours'
            ) THEN
                ALTER TABLE "Customer" ADD COLUMN "detentionFreeTimeHours" DOUBLE PRECISION;
                RAISE NOTICE 'Added detentionFreeTimeHours column';
            ELSE
                RAISE NOTICE 'detentionFreeTimeHours column already exists';
            END IF;

            -- Add detentionRate column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Customer' 
                AND column_name = 'detentionRate'
            ) THEN
                ALTER TABLE "Customer" ADD COLUMN "detentionRate" DOUBLE PRECISION;
                RAISE NOTICE 'Added detentionRate column';
            ELSE
                RAISE NOTICE 'detentionRate column already exists';
            END IF;
        END $$;
      `);
      console.log('   ✅ Customer detention fields added\n');
    } catch (error: any) {
      console.error('   ❌ Error adding Customer fields:', error.message);
    }

    // Fix 2: Add LoadExpense vendorId and reimbursable fields
    console.log('2. Adding LoadExpense vendor relation...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            -- Add vendorId column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'LoadExpense' 
                AND column_name = 'vendorId'
            ) THEN
                ALTER TABLE "LoadExpense" ADD COLUMN "vendorId" TEXT;
                RAISE NOTICE 'Added vendorId column';
                
                -- Add foreign key constraint if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'LoadExpense' 
                    AND constraint_name = 'LoadExpense_vendorId_fkey'
                ) THEN
                    ALTER TABLE "LoadExpense" 
                    ADD CONSTRAINT "LoadExpense_vendorId_fkey" 
                    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL;
                    RAISE NOTICE 'Added foreign key constraint';
                END IF;
            ELSE
                RAISE NOTICE 'vendorId column already exists';
            END IF;

            -- Add reimbursable column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'LoadExpense' 
                AND column_name = 'reimbursable'
            ) THEN
                ALTER TABLE "LoadExpense" ADD COLUMN "reimbursable" BOOLEAN NOT NULL DEFAULT false;
                RAISE NOTICE 'Added reimbursable column';
            ELSE
                RAISE NOTICE 'reimbursable column already exists';
            END IF;

            -- Create index on vendorId if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'LoadExpense' 
                AND indexname = 'LoadExpense_vendorId_idx'
            ) THEN
                CREATE INDEX "LoadExpense_vendorId_idx" ON "LoadExpense"("vendorId");
                RAISE NOTICE 'Created index on vendorId';
            END IF;
        END $$;
      `);
      console.log('   ✅ LoadExpense vendor relation added\n');
    } catch (error: any) {
      console.error('   ❌ Error adding LoadExpense fields:', error.message);
    }

    console.log('✅ Schema fixes applied successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Restart your Next.js dev server');
    
  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applySchemaFixes();



























