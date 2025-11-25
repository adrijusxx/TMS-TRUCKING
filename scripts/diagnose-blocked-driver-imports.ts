import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Diagnose why driver imports are failing
 * Checks for soft-deleted drivers that might be blocking imports due to unique constraints
 */
async function diagnoseBlockedImports() {
  console.log('🔍 Diagnosing blocked driver imports...\n');

  try {
    // Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    });

    for (const company of companies) {
      console.log(`\n📊 Company: ${company.name} (${company.id})`);
      console.log('─'.repeat(60));

      // Get all drivers (including deleted)
      const allDrivers = await prisma.driver.findMany({
        where: { companyId: company.id },
        select: {
          id: true,
          driverNumber: true,
          deletedAt: true,
          isActive: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              deletedAt: true,
              isActive: true,
            },
          },
        },
      });

      const deletedDrivers = allDrivers.filter(d => d.deletedAt !== null);
      const activeDrivers = allDrivers.filter(d => d.deletedAt === null);

      console.log(`Total drivers: ${allDrivers.length}`);
      console.log(`  Active: ${activeDrivers.length}`);
      console.log(`  Deleted: ${deletedDrivers.length}`);

      // Check for duplicate driver numbers (shouldn't happen, but check)
      const driverNumbers = new Map<string, number>();
      allDrivers.forEach(d => {
        const count = driverNumbers.get(d.driverNumber) || 0;
        driverNumbers.set(d.driverNumber, count + 1);
      });

      const duplicateDriverNumbers = Array.from(driverNumbers.entries())
        .filter(([_, count]) => count > 1);

      if (duplicateDriverNumbers.length > 0) {
        console.log(`\n⚠️  DUPLICATE DRIVER NUMBERS (database constraint violation!):`);
        duplicateDriverNumbers.forEach(([driverNumber, count]) => {
          console.log(`  - ${driverNumber}: ${count} drivers`);
        });
      }

      // Check for duplicate emails in users
      const userEmails = new Map<string, number>();
      for (const driver of allDrivers) {
        const email = driver.user?.email?.toLowerCase();
        if (email) {
          const count = userEmails.get(email) || 0;
          userEmails.set(email, count + 1);
        }
      }

      const duplicateEmails = Array.from(userEmails.entries())
        .filter(([_, count]) => count > 1);

      if (duplicateEmails.length > 0) {
        console.log(`\n⚠️  DUPLICATE USER EMAILS (database constraint violation!):`);
        duplicateEmails.forEach(([email, count]) => {
          console.log(`  - ${email}: ${count} users`);
        });
      }

      // Check for soft-deleted drivers that might block imports
      if (deletedDrivers.length > 0) {
        console.log(`\n🗑️  Soft-deleted drivers that might block imports:`);
        console.log(`  (These have unique constraints that prevent re-import)`);
        
        const blockingDrivers = deletedDrivers.slice(0, 10); // Show first 10
        blockingDrivers.forEach(driver => {
          console.log(`  - Driver #${driver.driverNumber}`);
          console.log(`    Email: ${driver.user?.email || 'N/A'}`);
          console.log(`    Deleted: ${driver.deletedAt}`);
          console.log(`    User ID: ${driver.userId}`);
          console.log(`    Driver ID: ${driver.id}`);
        });

        if (deletedDrivers.length > 10) {
          console.log(`  ... and ${deletedDrivers.length - 10} more deleted drivers`);
        }
      }

      // Check for orphaned users (deleted users with no driver)
      const allUsers = await prisma.user.findMany({
        where: {
          companyId: company.id,
          role: 'DRIVER',
        },
        select: {
          id: true,
          email: true,
          deletedAt: true,
          isActive: true,
          driver: {
            select: { id: true },
          },
        },
      });

      const orphanedUsers = allUsers.filter(u => !u.driver?.id && (u.deletedAt !== null || !u.isActive));
      
      if (orphanedUsers.length > 0) {
        console.log(`\n👻 Orphaned User records (DRIVER role but no Driver record):`);
        orphanedUsers.slice(0, 10).forEach(user => {
          console.log(`  - ${user.email} (${user.id})`);
          console.log(`    Deleted: ${user.deletedAt || 'No'}`);
          console.log(`    Active: ${user.isActive}`);
        });
        if (orphanedUsers.length > 10) {
          console.log(`  ... and ${orphanedUsers.length - 10} more orphaned users`);
        }
      }
    }

    console.log('\n\n💡 Solutions:');
    console.log('1. To permanently delete soft-deleted drivers:');
    console.log('   npm run db:soft-delete driver <id1> <id2> ...');
    console.log('   (Note: This will fail if there are foreign key constraints)');
    console.log('\n2. To reactivate soft-deleted drivers:');
    console.log('   Use the "Update existing drivers" option in import dialog');
    console.log('\n3. To permanently clean up all soft-deleted drivers:');
    console.log('   Run: tsx scripts/cleanup-soft-deleted-drivers.ts');
    console.log('\n4. For full database reset (WARNING: deletes ALL data):');
    console.log('   npm run db:reset');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseBlockedImports();

