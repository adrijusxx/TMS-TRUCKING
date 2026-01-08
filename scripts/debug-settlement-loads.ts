/**
 * Debug script to check why loads aren't appearing in settlement generation
 * Run with: npx ts-node scripts/debug-settlement-loads.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DEBUG: Settlement Loads Investigation ===\n');

    // 1. Get all drivers
    const drivers = await prisma.driver.findMany({
        select: {
            id: true,
            driverNumber: true,
            user: { select: { firstName: true, lastName: true } },
        },
    });

    console.log('--- All Drivers ---');
    for (const driver of drivers) {
        console.log(`  ${driver.id} - ${driver.user?.firstName} ${driver.user?.lastName} (${driver.driverNumber})`);
    }
    console.log('');

    // 2. Get all DELIVERED/INVOICED/PAID loads
    const deliveredLoads = await prisma.load.findMany({
        where: {
            status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
            deletedAt: null,
        },
        select: {
            id: true,
            loadNumber: true,
            status: true,
            driverId: true,
            readyForSettlement: true,
            deliveredAt: true,
            driver: {
                select: {
                    id: true,
                    driverNumber: true,
                    user: { select: { firstName: true, lastName: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    console.log('--- Delivered/Invoiced/Paid Loads (last 20) ---');
    if (deliveredLoads.length === 0) {
        console.log('  ⚠️  NO DELIVERED LOADS FOUND!');
    } else {
        for (const load of deliveredLoads) {
            const driverName = load.driver?.user
                ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
                : 'NO DRIVER';
            console.log(
                `  ${load.loadNumber} | Status: ${load.status} | Driver: ${driverName} (${load.driverId || 'null'}) | readyForSettlement: ${load.readyForSettlement} | deliveredAt: ${load.deliveredAt}`
            );
        }
    }
    console.log('');

    // 3. Check for loads with missing driverId
    const loadsWithoutDriver = await prisma.load.count({
        where: {
            status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
            driverId: null,
            deletedAt: null,
        },
    });
    console.log(`--- Delivered loads WITHOUT driver assigned: ${loadsWithoutDriver} ---`);

    // 4. Check for loads with readyForSettlement = false
    const loadsNotReady = await prisma.load.count({
        where: {
            status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
            readyForSettlement: false,
            deletedAt: null,
        },
    });
    console.log(`--- Delivered loads with readyForSettlement=false: ${loadsNotReady} ---`);

    // 5. Pick the first driver with delivered loads and simulate the API query
    const firstDriverWithLoads = deliveredLoads.find((l) => l.driverId);
    if (firstDriverWithLoads?.driverId) {
        console.log(`\n--- Simulating API query for driver ${firstDriverWithLoads.driverId} ---`);
        const apiLoads = await prisma.load.findMany({
            where: {
                driverId: firstDriverWithLoads.driverId,
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
                deletedAt: null,
            },
            select: {
                id: true,
                loadNumber: true,
                status: true,
                readyForSettlement: true,
            },
        });
        console.log(`  Found ${apiLoads.length} loads for this driver:`);
        for (const load of apiLoads) {
            console.log(`    ${load.loadNumber} | ${load.status} | readyForSettlement: ${load.readyForSettlement}`);
        }
    }

    console.log('\n=== END DEBUG ===');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
