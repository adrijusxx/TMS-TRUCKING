/**
 * Fix Contaminated Deduction Rules
 * 
 * This script finds DeductionRule records where:
 * - driverId is null (company-wide rule)
 * - But the rule name contains a specific driver number pattern (DRV-XX-XXXX-XXX)
 * 
 * It then assigns the correct driverId based on the driver number in the name.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixContaminatedDeductionRules() {
    console.log('🔍 Finding contaminated deduction rules...\n');

    // Find all rules with null driverId that contain driver number patterns
    const allRulesWithNullDriver = await prisma.deductionRule.findMany({
        where: {
            driverId: null,
        },
    });

    const driverNumberPattern = /DRV-[A-Z]{2}-[A-Z]+-\d+/g;
    const contaminatedRules: any[] = [];

    for (const rule of allRulesWithNullDriver) {
        const matches = rule.name.match(driverNumberPattern);
        if (matches && matches.length > 0) {
            contaminatedRules.push({
                ...rule,
                extractedDriverNumber: matches[0],
            });
        }
    }

    console.log(`Found ${contaminatedRules.length} contaminated rules:\n`);

    if (contaminatedRules.length === 0) {
        console.log('✅ No contaminated rules found. Database is clean!');
        return;
    }

    // Display what we found
    for (const rule of contaminatedRules) {
        console.log(`  - "${rule.name}" → Driver: ${rule.extractedDriverNumber}`);
    }

    console.log('\n🔧 Fixing rules by assigning correct driverId...\n');

    let fixed = 0;
    let notFound = 0;
    let errors = 0;

    for (const rule of contaminatedRules) {
        try {
            // Find the driver by their driverNumber
            const driver = await prisma.driver.findFirst({
                where: {
                    driverNumber: rule.extractedDriverNumber,
                    companyId: rule.companyId,
                },
            });

            if (driver) {
                // Update the rule to assign the correct driverId
                await prisma.deductionRule.update({
                    where: { id: rule.id },
                    data: { driverId: driver.id },
                });
                console.log(`  ✅ Fixed: "${rule.name}" → assigned to ${driver.driverNumber}`);
                fixed++;
            } else {
                console.log(`  ⚠️ Driver not found for: "${rule.name}" (${rule.extractedDriverNumber})`);
                notFound++;
            }
        } catch (error: any) {
            console.error(`  ❌ Error fixing "${rule.name}": ${error.message}`);
            errors++;
        }
    }

    console.log('\n📊 Summary:');
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Driver not found: ${notFound}`);
    console.log(`  Errors: ${errors}`);
    console.log('\n✅ Done! Regenerate your batch to see the fix.');
}

fixContaminatedDeductionRules()
    .catch((e) => {
        console.error('Script error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
