/**
 * Debug script to find ALL recently created DELIVERED loads
 * Run with: npx ts-node scripts/debug-recent-deliveries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DEBUG: Recent Delivered Loads ===\n');

    // 1. Get ALL DELIVERED loads ordered by most recent first
    const recentLoads = await prisma.load.findMany({
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
            createdAt: true,
            driver: {
                select: {
                    id: true,
                    driverNumber: true,
                    user: { select: { firstName: true, lastName: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 30, // Last 30 loads
    });

    console.log('--- 30 Most Recent Delivered/Invoiced/Paid Loads ---\n');
    for (const load of recentLoads) {
        const driverName = load.driver?.user
            ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
            : '⚠️  NO DRIVER';
        console.log(
            `${load.loadNumber.padEnd(20)} | Status: ${load.status.padEnd(10)} | Driver: ${driverName.padEnd(25)} | driverId: ${load.driverId || 'NULL'} | readyForSettlement: ${load.readyForSettlement}`
        );
    }

    // 2. Find loads where driverId is NULL
    console.log('\n--- Loads with NULL driverId ---');
    const nullDriverLoads = recentLoads.filter((l) => !l.driverId);
    if (nullDriverLoads.length === 0) {
        console.log('  None found in last 30 loads.');
    } else {
        for (const load of nullDriverLoads) {
            console.log(`  ${load.loadNumber} | Status: ${load.status}`);
        }
    }

    // 3. Find loads where readyForSettlement is false
    console.log('\n--- Loads with readyForSettlement = false ---');
    const notReadyLoads = recentLoads.filter((l) => l.readyForSettlement === false);
    if (notReadyLoads.length === 0) {
        console.log('  None found in last 30 loads.');
    } else {
        for (const load of notReadyLoads) {
            const driverName = load.driver?.user
                ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
                : 'NO DRIVER';
            console.log(`  ${load.loadNumber} | ${load.status} | Driver: ${driverName}`);
        }
    }

    // 4. Find driver "James Andrew Lamonica" specifically
    console.log('\n--- Looking for driver "James Andrew Lamonica" ---');
    const james = await prisma.driver.findFirst({
        where: {
            user: {
                firstName: { contains: 'James', mode: 'insensitive' },
                lastName: { contains: 'Lamonica', mode: 'insensitive' },
            },
        },
        select: {
            id: true,
            driverNumber: true,
            user: { select: { firstName: true, lastName: true } },
        },
    });

    if (james) {
        console.log(`  Found: ${james.user?.firstName} ${james.user?.lastName} (ID: ${james.id})`);

        const jamesLoads = await prisma.load.findMany({
            where: {
                driverId: james.id,
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
                deletedAt: null,
            },
            select: {
                id: true,
                loadNumber: true,
                status: true,
                readyForSettlement: true,
                deliveredAt: true,
            },
        });

        console.log(`\n  Loads assigned to James: ${jamesLoads.length}`);
        for (const load of jamesLoads) {
            console.log(`    ${load.loadNumber} | ${load.status} | readyForSettlement: ${load.readyForSettlement}`);
        }
    } else {
        console.log('  ⚠️  Driver not found!');

        // List all drivers to help find the correct one
        console.log('\n  Available drivers:');
        const allDrivers = await prisma.driver.findMany({
            select: {
                id: true,
                driverNumber: true,
                user: { select: { firstName: true, lastName: true } },
            },
            take: 20,
        });
        for (const d of allDrivers) {
            console.log(`    ${d.id} - ${d.user?.firstName} ${d.user?.lastName} (${d.driverNumber})`);
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
