/**
 * Debug script to find the latest loads by createdAt regardless of status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DEBUG: Very Latest Loads (Any Status) ===\n');

    // Get the 10 most recently created loads regardless of status
    const latestLoads = await prisma.load.findMany({
        where: {
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
        take: 10,
    });

    console.log('--- 10 Most Recently Created Loads ---\n');
    for (const load of latestLoads) {
        const driverName = load.driver?.user
            ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
            : '⚠️  NO DRIVER';
        console.log(
            `${load.loadNumber.padEnd(20)} | Status: ${load.status.padEnd(12)} | Driver: ${driverName.padEnd(25)} | readyForSettlement: ${load.readyForSettlement} | Created: ${load.createdAt.toISOString()}`
        );
    }

    // Show the James driver ID again for comparison
    console.log('\n--- James Andrew Lamonica\'s Driver ID ---');
    const james = await prisma.driver.findFirst({
        where: {
            user: {
                firstName: { contains: 'James', mode: 'insensitive' },
                lastName: { contains: 'Lamonica', mode: 'insensitive' },
            },
        },
        select: { id: true },
    });
    console.log(`  James's ID: ${james?.id}`);

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
