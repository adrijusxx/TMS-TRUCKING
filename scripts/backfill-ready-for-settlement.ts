/**
 * Comprehensive backfill script to fix ALL loads that should be settlement-ready.
 * This handles imported loads that don't have readyForSettlement set.
 * 
 * Run with: npx ts-node scripts/backfill-ready-for-settlement.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Backfill: readyForSettlement for ALL eligible loads ===\n');

    // Find ALL loads that are DELIVERED/INVOICED/PAID, have a driver, but readyForSettlement is false
    const eligibleLoads = await prisma.load.findMany({
        where: {
            status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
            driverId: { not: null },
            readyForSettlement: false,
            deletedAt: null,
        },
        select: {
            id: true,
            loadNumber: true,
            status: true,
            deliveredAt: true,
            readyForSettlement: true,
            createdAt: true,
        },
    });

    console.log(`Found ${eligibleLoads.length} loads to update (status=DELIVERED/INVOICED/PAID, has driver, readyForSettlement != true)\n`);

    if (eligibleLoads.length === 0) {
        console.log('No loads need updating. All eligible loads already have readyForSettlement=true.');
        return;
    }

    // Show sample of loads being updated
    console.log('Sample of loads being updated (first 10):');
    for (const load of eligibleLoads.slice(0, 10)) {
        console.log(`  ${load.loadNumber} | status=${load.status} | readyForSettlement=${load.readyForSettlement} | deliveredAt=${load.deliveredAt}`);
    }
    if (eligibleLoads.length > 10) {
        console.log(`  ... and ${eligibleLoads.length - 10} more\n`);
    }

    // Update all eligible loads
    let updatedCount = 0;
    let errorCount = 0;

    for (const load of eligibleLoads) {
        try {
            await prisma.load.update({
                where: { id: load.id },
                data: {
                    readyForSettlement: true,
                    // Set deliveredAt if it's missing (use createdAt as fallback)
                    ...(load.deliveredAt ? {} : { deliveredAt: load.createdAt }),
                },
            });
            updatedCount++;
        } catch (error: any) {
            console.error(`  Error updating ${load.loadNumber}: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n=== Backfill Complete ===`);
    console.log(`  Updated: ${updatedCount} loads`);
    console.log(`  Errors: ${errorCount} loads`);

    // Also check for loads with DELIVERED status but no deliveredAt date
    const loadsWithoutDeliveredAt = await prisma.load.count({
        where: {
            status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
            deliveredAt: null,
            deletedAt: null,
        },
    });
    if (loadsWithoutDeliveredAt > 0) {
        console.log(`\n⚠️  Warning: ${loadsWithoutDeliveredAt} delivered loads still have no deliveredAt date.`);
    }
}

main()
    .catch((e) => {
        console.error('Error during backfill:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
