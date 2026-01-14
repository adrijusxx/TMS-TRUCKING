/**
 * Fix Orphaned Deduction Rules
 * 
 * This script finds deduction rules that have:
 * - driverId: null
 * - name pattern: "Driver [DRIVER_NUMBER] - [TYPE]"
 * 
 * And updates them to set the correct driverId based on the driver number in the name.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanedRules() {
    console.log('🔍 Finding orphaned deduction rules...\n');

    // Find all rules with null driverId that have "Driver " in the name
    const orphanedRules = await prisma.deductionRule.findMany({
        where: {
            driverId: null,
            name: {
                startsWith: 'Driver ',
            },
        },
        select: {
            id: true,
            name: true,
            companyId: true,
            driverType: true,
            isActive: true,
        },
    });

    console.log(`Found ${orphanedRules.length} potentially orphaned rules:\n`);

    if (orphanedRules.length === 0) {
        console.log('✅ No orphaned rules found. Database is clean!');
        return;
    }

    // Extract driver numbers from rule names and find matching drivers
    let fixed = 0;
    let notFound = 0;

    for (const rule of orphanedRules) {
        console.log(`Processing: "${rule.name}"`);

        // Extract driver number from name using regex
        // Pattern: "Driver DRV-XX-XXXX-XXX - TYPE" or similar
        const match = rule.name.match(/^Driver\s+([\w-]+)\s*-/);

        if (!match) {
            console.log(`  ⚠️ Could not extract driver number from name`);
            notFound++;
            continue;
        }

        const driverNumber = match[1];
        console.log(`  📋 Extracted driver number: ${driverNumber}`);

        // Find the driver with this number in the same company
        const driver = await prisma.driver.findFirst({
            where: {
                companyId: rule.companyId,
                driverNumber: driverNumber,
            },
            select: {
                id: true,
                driverNumber: true,
            },
        });

        if (!driver) {
            console.log(`  ❌ No driver found with number "${driverNumber}" in company`);
            notFound++;
            continue;
        }

        console.log(`  ✅ Found driver: ${driver.id}`);

        // Update the rule with the correct driverId
        await prisma.deductionRule.update({
            where: { id: rule.id },
            data: { driverId: driver.id },
        });

        console.log(`  ✅ Updated rule with driverId: ${driver.id}`);
        fixed++;
    }

    console.log('\n========================================');
    console.log('📊 Summary:');
    console.log(`   Total orphaned rules: ${orphanedRules.length}`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Could not fix: ${notFound}`);
    console.log('========================================\n');

    if (notFound > 0) {
        console.log('⚠️ Some rules could not be fixed automatically.');
        console.log('   These may have driver numbers that no longer exist.');
        console.log('   Consider deactivating or deleting them manually.\n');
    }
}

async function main() {
    try {
        await fixOrphanedRules();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
