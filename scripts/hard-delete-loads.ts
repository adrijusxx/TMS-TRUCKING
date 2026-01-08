/**
 * Hard delete ALL loads from the database for testing purposes
 * 
 * WARNING: This permanently deletes data! Only run in development.
 * 
 * Run with: npx ts-node scripts/hard-delete-loads.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Hard Delete All Loads ===\n');
    console.log('⚠️  WARNING: This will PERMANENTLY delete ALL loads from the database!\n');

    // Count loads first
    const loadCount = await prisma.load.count();
    console.log(`Found ${loadCount} loads in database.\n`);

    if (loadCount === 0) {
        console.log('No loads to delete.');
        return;
    }

    console.log('Deleting related records first...\n');

    // Delete related records in order due to foreign key constraints

    // 1. Load Status History
    const statusHistoryCount = await prisma.loadStatusHistory.deleteMany({});
    console.log(`  Deleted ${statusHistoryCount.count} load status history records`);

    // 2. Load Stops
    const stopsCount = await prisma.loadStop.deleteMany({});
    console.log(`  Deleted ${stopsCount.count} load stops`);

    // 3. Load Expenses
    const expensesCount = await prisma.loadExpense.deleteMany({});
    console.log(`  Deleted ${expensesCount.count} load expenses`);

    // 4. Rate Confirmations (if they reference loads)
    try {
        const rateConCount = await prisma.rateConfirmation.deleteMany({});
        console.log(`  Deleted ${rateConCount.count} rate confirmations`);
    } catch (e) {
        console.log('  Rate confirmations: skipped (no records or different relation)');
    }

    // 5. Settlement Loads - settlements store loadIds as an array field, not a junction table
    console.log('  Settlement load links: skipped (stored as array in settlements)');

    // 6. Documents linked to loads
    try {
        const docsCount = await prisma.document.deleteMany({
            where: { loadId: { not: null } },
        });
        console.log(`  Deleted ${docsCount.count} documents linked to loads`);
    } catch (e) {
        console.log('  Load documents: skipped');
    }

    // 7. Activity logs for loads
    try {
        const activityCount = await prisma.activityLog.deleteMany({
            where: { entityType: 'Load' },
        });
        console.log(`  Deleted ${activityCount.count} activity logs for loads`);
    } catch (e) {
        console.log('  Activity logs: skipped');
    }

    // 8. Finally delete loads
    console.log('\nDeleting all loads...');
    const deletedLoads = await prisma.load.deleteMany({});
    console.log(`  ✅ Deleted ${deletedLoads.count} loads`);

    console.log('\n=== Hard Delete Complete ===');
    console.log('You can now reimport fresh loads.');
}

main()
    .catch((e) => {
        console.error('Error during deletion:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
