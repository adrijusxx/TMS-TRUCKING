import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Soft delete records from any table
 * Usage: tsx scripts/soft-delete-records.ts <model> <id1> [id2] [id3] ...
 * 
 * Examples:
 *   tsx scripts/soft-delete-records.ts user clxxx123
 *   tsx scripts/soft-delete-records.ts driver clxxx123 clxxx456
 *   tsx scripts/soft-delete-records.ts load clxxx123
 */
async function softDeleteRecords() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: tsx scripts/soft-delete-records.ts <model> <id1> [id2] [id3] ...');
    console.error('\nAvailable models:');
    console.error('  - user');
    console.error('  - driver');
    console.error('  - load');
    console.error('  - truck');
    console.error('  - trailer');
    console.error('  - customer');
    console.error('  - invoice');
    console.error('  - settlement');
    console.error('  - breakdown');
    console.error('  - maintenanceRecord');
    console.error('  - inspection');
    console.error('  - document');
    console.error('  - vendor');
    console.error('  - mcNumber');
    console.error('  - company (use with extreme caution!)');
    console.error('\nOr any other Prisma model name (camelCase)');
    process.exit(1);
  }

  const modelName = args[0];
  const ids = args.slice(1);

  // Map common names to Prisma model names
  const modelMap: Record<string, string> = {
    'driver': 'driver',
    'user': 'user',
    'load': 'load',
    'truck': 'truck',
    'trailer': 'trailer',
    'customer': 'customer',
    'invoice': 'invoice',
    'settlement': 'settlement',
    'breakdown': 'breakdown',
    'maintenance': 'maintenanceRecord',
    'maintenanceRecord': 'maintenanceRecord',
    'inspection': 'inspection',
    'document': 'document',
    'vendor': 'vendor',
    'mcNumber': 'mcNumber',
    'mc': 'mcNumber',
    'company': 'company',
  };

  const prismaModelName = modelMap[modelName.toLowerCase()] || modelName;

  // Verify model exists
  const model = (prisma as any)[prismaModelName];
  if (!model) {
    console.error(`❌ Model "${prismaModelName}" not found in Prisma client.`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && typeof (prisma as any)[key]?.findMany === 'function').join(', '));
    process.exit(1);
  }

  try {
    console.log(`🔍 Checking ${ids.length} record(s) in ${prismaModelName}...`);
    
    // First, check if records exist and are not already deleted
    const records = await (model.findMany as any)({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (records.length === 0) {
      console.error(`❌ No records found with the provided IDs.`);
      process.exit(1);
    }

    const alreadyDeleted = records.filter((r: any) => r.deletedAt !== null);
    const toDelete = records.filter((r: any) => r.deletedAt === null);

    if (alreadyDeleted.length > 0) {
      console.log(`⚠️  ${alreadyDeleted.length} record(s) are already soft-deleted:`, alreadyDeleted.map((r: any) => r.id));
    }

    if (toDelete.length === 0) {
      console.log('✅ All records are already soft-deleted.');
      process.exit(0);
    }

    console.log(`📝 Found ${toDelete.length} record(s) to soft-delete:`);
    toDelete.forEach((r: any) => console.log(`   - ${r.id}`));

    // Check if model has deletedAt and isActive fields by fetching a sample
    const sampleRecord = await (model.findFirst as any)({
      where: { id: toDelete[0].id },
    });

    if (!sampleRecord) {
      console.error('❌ Could not fetch sample record to check schema.');
      process.exit(1);
    }

    // Prepare delete data - always try deletedAt (most models have it)
    const deleteData: any = {
      deletedAt: new Date(),
    };

    // Some models also have isActive field - set it to false if it exists
    if ('isActive' in sampleRecord) {
      deleteData.isActive = false;
    }

    // Perform soft delete
    console.log(`\n🗑️  Soft-deleting ${toDelete.length} record(s)...`);
    
    const result = await (model.updateMany as any)({
      where: {
        id: { in: toDelete.map((r: any) => r.id) },
        deletedAt: null,
      },
      data: deleteData,
    });

    console.log(`\n✅ Successfully soft-deleted ${result.count} record(s)!`);
    
    // Verify deletion
    const verifyRecords = await (model.findMany as any)({
      where: {
        id: { in: toDelete.map((r: any) => r.id) },
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    const stillActive = verifyRecords.filter((r: any) => r.deletedAt === null);
    if (stillActive.length > 0) {
      console.warn(`⚠️  Warning: ${stillActive.length} record(s) were not deleted:`, stillActive.map((r: any) => r.id));
    } else {
      console.log('✅ Verification: All records successfully soft-deleted.');
    }

  } catch (error: any) {
    console.error('❌ Error soft-deleting records:', error.message);
    if (error.code === 'P2003') {
      console.error('\n💡 This error usually means there are related records that prevent deletion.');
      console.error('   Try deleting related records first, or use the application UI for safe deletion.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

softDeleteRecords();

