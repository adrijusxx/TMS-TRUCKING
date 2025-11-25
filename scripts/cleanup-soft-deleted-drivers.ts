import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up soft-deleted drivers that are blocking imports
 * Options:
 * 1. Permanently delete soft-deleted drivers (and their users)
 * 2. Reactivate soft-deleted drivers (set deletedAt to null)
 * 
 * Usage:
 *   tsx scripts/cleanup-soft-deleted-drivers.ts --action=delete
 *   tsx scripts/cleanup-soft-deleted-drivers.ts --action=reactivate
 *   tsx scripts/cleanup-soft-deleted-drivers.ts --action=delete --company-id=<company-id>
 */
async function cleanupSoftDeletedDrivers() {
  const args = process.argv.slice(2);
  const actionArg = args.find(arg => arg.startsWith('--action='));
  const companyArg = args.find(arg => arg.startsWith('--company-id='));
  const dryRunArg = args.includes('--dry-run');

  const action = actionArg?.split('=')[1] || 'list'; // list, delete, reactivate
  const companyId = companyArg?.split('=')[1];
  const isDryRun = dryRunArg;

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  console.log(`Action: ${action}`);
  if (companyId) {
    console.log(`Company ID: ${companyId}`);
  }
  console.log();

  try {
    // Build where clause
    const where: any = {
      deletedAt: { not: null }, // Only soft-deleted drivers
    };

    if (companyId) {
      where.companyId = companyId;
    }

    // Get soft-deleted drivers
    const deletedDrivers = await prisma.driver.findMany({
      where,
      select: {
        id: true,
        driverNumber: true,
        deletedAt: true,
        companyId: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            deletedAt: true,
          },
        },
      },
    });

    if (deletedDrivers.length === 0) {
      console.log('✅ No soft-deleted drivers found.');
      return;
    }

    console.log(`Found ${deletedDrivers.length} soft-deleted driver(s)\n`);

    // Group by company
    const byCompany = new Map<string, typeof deletedDrivers>();
    for (const driver of deletedDrivers) {
      const companyDrivers = byCompany.get(driver.companyId) || [];
      companyDrivers.push(driver);
      byCompany.set(driver.companyId, companyDrivers);
    }

    for (const [compId, drivers] of byCompany.entries()) {
      const company = await prisma.company.findUnique({
        where: { id: compId },
        select: { name: true },
      });
      console.log(`\n📊 Company: ${company?.name || compId}`);
      console.log(`   Drivers: ${drivers.length}`);
    }

    if (action === 'list') {
      console.log('\n📋 Soft-deleted drivers:');
      deletedDrivers.slice(0, 20).forEach((driver, idx) => {
        console.log(`${idx + 1}. Driver #${driver.driverNumber}`);
        console.log(`   Email: ${driver.user?.email || 'N/A'}`);
        console.log(`   Deleted: ${driver.deletedAt}`);
        console.log(`   IDs: Driver=${driver.id}, User=${driver.userId}`);
      });
      if (deletedDrivers.length > 20) {
        console.log(`\n   ... and ${deletedDrivers.length - 20} more`);
      }

      console.log('\n💡 To permanently delete these drivers:');
      console.log('   tsx scripts/cleanup-soft-deleted-drivers.ts --action=delete');
      console.log('\n💡 To reactivate these drivers:');
      console.log('   tsx scripts/cleanup-soft-deleted-drivers.ts --action=reactivate');
      return;
    }

    if (action === 'reactivate') {
      console.log(`\n♻️  Reactivating ${deletedDrivers.length} soft-deleted driver(s)...`);

      if (isDryRun) {
        console.log('DRY RUN: Would reactivate:');
        deletedDrivers.forEach(d => {
          console.log(`  - ${d.driverNumber} (${d.user?.email})`);
        });
        return;
      }

      let reactivated = 0;
      let errors = 0;

      for (const driver of deletedDrivers) {
        try {
          // Reactivate driver
          await prisma.driver.update({
            where: { id: driver.id },
            data: {
              deletedAt: null,
              isActive: true,
            },
          });

          // Reactivate user
          await prisma.user.update({
            where: { id: driver.userId },
            data: {
              deletedAt: null,
              isActive: true,
            },
          });

          reactivated++;
          console.log(`✅ Reactivated: ${driver.driverNumber}`);
        } catch (error: any) {
          errors++;
          console.error(`❌ Failed to reactivate ${driver.driverNumber}: ${error.message}`);
        }
      }

      console.log(`\n✅ Reactivated ${reactivated} driver(s)`);
      if (errors > 0) {
        console.log(`❌ Failed to reactivate ${errors} driver(s)`);
      }
      return;
    }

    if (action === 'delete') {
      console.log(`\n🗑️  PERMANENTLY DELETING ${deletedDrivers.length} soft-deleted driver(s)...`);
      console.log('⚠️  WARNING: This will permanently delete these drivers and their user accounts!');
      console.log('⚠️  This action cannot be undone!\n');

      if (isDryRun) {
        console.log('DRY RUN: Would permanently delete:');
        deletedDrivers.forEach(d => {
          console.log(`  - Driver #${d.driverNumber} (${d.user?.email})`);
        });
        return;
      }

      // Check for related records that might prevent deletion
      let canDelete = true;
      const blockingRecords: Array<{ driver: string; reason: string }> = [];

      for (const driver of deletedDrivers.slice(0, 5)) {
        // Check for loads
        const loads = await prisma.load.count({
          where: {
            OR: [
              { driverId: driver.id },
              { coDriverId: driver.id },
            ],
          },
        });

        if (loads > 0) {
          canDelete = false;
          blockingRecords.push({
            driver: driver.driverNumber,
            reason: `Has ${loads} associated load(s)`,
          });
        }

        // Check for settlements
        const settlements = await prisma.settlement.count({
          where: { driverId: driver.id },
        });

        if (settlements > 0) {
          canDelete = false;
          blockingRecords.push({
            driver: driver.driverNumber,
            reason: `Has ${settlements} associated settlement(s)`,
          });
        }
      }

      if (!canDelete && blockingRecords.length > 0) {
        console.log('❌ Cannot permanently delete - drivers have related records:');
        blockingRecords.forEach(br => {
          console.log(`  - ${br.driver}: ${br.reason}`);
        });
        console.log('\n💡 Option 1: Delete related records first');
        console.log('💡 Option 2: Keep drivers soft-deleted and use "Update existing" in import');
        console.log('💡 Option 3: Use database reset (npm run db:reset) - deletes ALL data');
        return;
      }

      let deleted = 0;
      let errors = 0;

      // Delete in reverse order: Driver first (which cascades to user via foreign key)
      // Actually, we need to delete user first, then driver
      for (const driver of deletedDrivers) {
        try {
          // First delete the driver (it has foreign key to user)
          await prisma.driver.delete({
            where: { id: driver.id },
          });

          // Then delete the user (if no other relationships)
          try {
            await prisma.user.delete({
              where: { id: driver.userId },
            });
          } catch (error: any) {
            // User might have other relationships, just log it
            console.warn(`⚠️  Could not delete user ${driver.userId}: ${error.message}`);
          }

          deleted++;
          console.log(`✅ Deleted: ${driver.driverNumber}`);
        } catch (error: any) {
          errors++;
          console.error(`❌ Failed to delete ${driver.driverNumber}: ${error.message}`);
        }
      }

      console.log(`\n✅ Permanently deleted ${deleted} driver(s)`);
      if (errors > 0) {
        console.log(`❌ Failed to delete ${errors} driver(s)`);
      }
      return;
    }

    console.error(`❌ Unknown action: ${action}`);
    console.error('Valid actions: list, reactivate, delete');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSoftDeletedDrivers();

