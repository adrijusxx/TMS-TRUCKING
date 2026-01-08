/**
 * Quick fix script to set the two test loads to DELIVERED status
 * Run with: npx ts-node scripts/fix-pending-loads.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Fixing Pending Test Loads ===\n');

    // Find the two most recent loads that are still PENDING
    const pendingLoads = await prisma.load.findMany({
        where: {
            status: 'PENDING',
            deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
            id: true,
            loadNumber: true,
            status: true,
            driverId: true,
            dispatchStatus: true,
        },
    });

    console.log(`Found ${pendingLoads.length} pending loads to fix:`);
    for (const load of pendingLoads) {
        console.log(`  ${load.loadNumber} | driverId: ${load.driverId} | dispatchStatus: ${load.dispatchStatus}`);
    }

    // Update each load to DELIVERED status
    for (const load of pendingLoads) {
        if (load.driverId) {
            console.log(`\nUpdating load ${load.loadNumber} to DELIVERED...`);
            await prisma.load.update({
                where: { id: load.id },
                data: {
                    status: 'DELIVERED',
                    dispatchStatus: 'DELIVERED',
                    readyForSettlement: true,
                    deliveredAt: new Date(),
                },
            });
            console.log(`  ✅ Load ${load.loadNumber} updated successfully`);
        } else {
            console.log(`  ⚠️  Skipping ${load.loadNumber} - no driver assigned`);
        }
    }

    console.log('\n=== Fix Complete ===');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
