/**
 * Migration script to convert Load mcNumber strings to mcNumberId foreign keys
 * Matches existing mcNumber string values to McNumber records
 * Sets mcNumberId based on matching
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Load mcNumberId migration check...');

  // Get all loads without mcNumberId (in case there are legacy loads)
  const loads = await prisma.load.findMany({
    where: {
      mcNumberId: null,
    },
    select: {
      id: true,
      companyId: true,
    },
  });

  console.log(`Found ${loads.length} loads without mcNumberId`);

  if (loads.length === 0) {
    console.log('✅ All loads already have mcNumberId assigned. No migration needed.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const load of loads) {
    try {
      // Find default MC number for the company
      const defaultMcNumber = await prisma.mcNumber.findFirst({
        where: {
          companyId: load.companyId,
          isDefault: true,
        },
        select: {
          id: true,
        },
      });

      if (defaultMcNumber) {
        // Update load with default mcNumberId
        await prisma.load.update({
          where: { id: load.id },
          data: { mcNumberId: defaultMcNumber.id },
        });
        console.log(`Updated load ${load.id}: assigned mcNumberId "${defaultMcNumber.id}"`);
        updated++;
      } else {
        // Try to find any MC number for the company
        const anyMcNumber = await prisma.mcNumber.findFirst({
          where: {
            companyId: load.companyId,
          },
          select: {
            id: true,
          },
        });

        if (anyMcNumber) {
          await prisma.load.update({
            where: { id: load.id },
            data: { mcNumberId: anyMcNumber.id },
          });
          console.log(`Updated load ${load.id}: assigned mcNumberId "${anyMcNumber.id}" (non-default)`);
          updated++;
        } else {
          console.log(`Skipped load ${load.id}: No MC Number found for company ${load.companyId}`);
          skipped++;
        }
      }
    } catch (error) {
      console.error(`Error updating load ${load.id}:`, error);
      errors++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Errors: ${errors}`);
  
  if (errors > 0) {
    console.warn('\n⚠️  Some loads could not be migrated. Please review the errors above.');
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

