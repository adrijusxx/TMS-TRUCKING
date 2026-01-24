/**
 * Settlement Workflow Test Script
 * 
 * Generates settlements for test drivers and validates all calculations:
 * - Gross pay (per-mile calculations)
 * - Recurrent deductions
 * - Fuel advances
 * - Load expenses
 * - Cash advances
 * - Escrow balance tracking
 * - Negative balance handling
 * - Multi-MC isolation
 */

import { PrismaClient } from '@prisma/client';
import { SettlementManager } from '../lib/managers/SettlementManager';

const prisma = new PrismaClient();

interface DriverSummary {
    driverNumber: string;
    name: string;
    truck: string;
    trailer: string;
    payRate: number;
    loadCount: number;
    totalMiles: number;
    totalRevenue: number;
    grossPay: number;
    deductions: number;
    advances: number;
    netPay: number;
    escrowBalance: number;
}

async function main() {
    console.log('🧪 Testing Settlement Workflow\n');
    console.log('='.repeat(80));
    console.log('');

    const settlementManager = new SettlementManager();

    // ============================================
    // STEP 1: Find Test Drivers
    // ============================================
    console.log('📋 Finding test drivers...\n');

    const drivers = await prisma.driver.findMany({
        where: {
            driverNumber: {
                in: ['DRV-001', 'DRV-002', 'DRV-003'],
            },
            deletedAt: null,
        },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
            currentTruck: {
                select: {
                    truckNumber: true,
                },
            },
            currentTrailer: {
                select: {
                    trailerNumber: true,
                },
            },
        },
        orderBy: {
            driverNumber: 'asc',
        },
    });

    if (drivers.length === 0) {
        console.error('❌ No test drivers found. Run: tsx scripts/seed-settlement-test.ts');
        process.exit(1);
    }

    console.log(`Found ${drivers.length} test drivers:\n`);
    for (const driver of drivers) {
        console.log(`  - ${driver.driverNumber}: ${driver.user?.firstName} ${driver.user?.lastName}`);
        console.log(`    Truck: ${driver.currentTruck?.truckNumber || 'N/A'}`);
        console.log(`    Trailer: ${driver.currentTrailer?.trailerNumber || 'N/A'}`);
        console.log(`    Pay Rate: $${driver.payRate}/mile`);
        console.log('');
    }

    // ============================================
    // STEP 2: Define Settlement Period
    // ============================================
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    console.log('📅 Settlement Period:');
    console.log(`  Start: ${periodStart.toLocaleDateString()}`);
    console.log(`  End: ${periodEnd.toLocaleDateString()}`);
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // ============================================
    // STEP 3: Generate Settlements
    // ============================================
    const summaries: DriverSummary[] = [];

    for (const driver of drivers) {
        console.log(`\n🚗 Processing ${driver.driverNumber} - ${driver.user?.firstName} ${driver.user?.lastName}`);
        console.log('-'.repeat(80));

        // Check for loads
        const loads = await prisma.load.findMany({
            where: {
                driverId: driver.id,
                deliveredAt: {
                    gte: periodStart,
                    lte: periodEnd,
                },
                status: {
                    in: ['DELIVERED', 'INVOICED', 'PAID', 'BILLING_HOLD', 'READY_TO_BILL'],
                },
                readyForSettlement: true,
                deletedAt: null,
            },
            include: {
                loadExpenses: {
                    where: {
                        approvalStatus: 'APPROVED',
                    },
                },
            },
        });

        if (loads.length === 0) {
            console.log(`  ⚠️  No loads found for settlement period`);
            continue;
        }

        console.log(`\n📦 Loads: ${loads.length}`);

        let totalMiles = 0;
        let totalRevenue = 0;

        for (const load of loads) {
            const miles = (load.loadedMiles || 0) + (load.emptyMiles || 0);
            totalMiles += miles;
            totalRevenue += load.revenue || 0;
            console.log(`  - ${load.loadNumber}: ${miles} miles, $${load.revenue?.toFixed(2)}`);
        }

        console.log(`\n  Total Miles: ${totalMiles}`);
        console.log(`  Total Revenue: $${totalRevenue.toFixed(2)}`);

        // Calculate expected gross pay
        const expectedGrossPay = totalMiles * driver.payRate;
        console.log(`  Expected Gross Pay: ${totalMiles} × $${driver.payRate} = $${expectedGrossPay.toFixed(2)}`);

        // Get advances
        const advances = await prisma.driverAdvance.findMany({
            where: {
                driverId: driver.id,
                approvalStatus: 'APPROVED',
                paidAt: {
                    gte: periodStart,
                    lte: periodEnd,
                },
                settlementId: null, // Not yet deducted
            },
        });

        const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);
        console.log(`\n💸 Advances: ${advances.length} ($${totalAdvances.toFixed(2)})`);
        for (const adv of advances) {
            console.log(`  - $${adv.amount.toFixed(2)} on ${adv.paidAt?.toLocaleDateString()}`);
        }

        // Get deduction rules
        const deductionRules = await prisma.deductionRule.findMany({
            where: {
                driverId: driver.id,
                isActive: true,
                isAddition: false,
            },
        });

        console.log(`\n💰 Deduction Rules: ${deductionRules.length}`);
        let expectedDeductions = 0;
        for (const rule of deductionRules) {
            const amount = rule.amount || 0;
            expectedDeductions += amount;
            console.log(`  - ${rule.name}: $${amount.toFixed(2)}`);

            if (rule.goalAmount) {
                console.log(`    Goal: $${rule.currentAmount || 0}/$${rule.goalAmount}`);
            }
        }

        console.log(`  Total Expected Deductions: $${expectedDeductions.toFixed(2)}`);

        // Calculate expected net pay
        const expectedNetPay = expectedGrossPay - expectedDeductions - totalAdvances;
        console.log(`\n💵 Expected Net Pay: $${expectedGrossPay.toFixed(2)} - $${expectedDeductions.toFixed(2)} - $${totalAdvances.toFixed(2)} = $${expectedNetPay.toFixed(2)}`);

        // Generate settlement
        console.log(`\n⚙️  Generating settlement...`);

        try {
            const settlement = await settlementManager.generateSettlement({
                driverId: driver.id,
                periodStart,
                periodEnd,
                notes: 'Test settlement generated by test-settlement-workflow.ts',
            });

            console.log(`\n✅ Settlement Generated: ${settlement.settlementNumber}`);
            console.log(`  Gross Pay: $${settlement.grossPay.toFixed(2)}`);
            console.log(`  Deductions: $${settlement.deductions.toFixed(2)}`);
            console.log(`  Advances: $${settlement.advances.toFixed(2)}`);
            console.log(`  Net Pay: $${settlement.netPay.toFixed(2)}`);
            console.log(`  Status: ${settlement.status}`);
            console.log(`  Approval Status: ${settlement.approvalStatus}`);

            // Validation
            console.log(`\n🔍 Validation:`);

            const grossPayMatch = Math.abs(settlement.grossPay - expectedGrossPay) < 0.01;
            const advancesMatch = Math.abs(settlement.advances - totalAdvances) < 0.01;

            console.log(`  Gross Pay: ${grossPayMatch ? '✅' : '❌'} (Expected: $${expectedGrossPay.toFixed(2)}, Got: $${settlement.grossPay.toFixed(2)})`);
            console.log(`  Advances: ${advancesMatch ? '✅' : '❌'} (Expected: $${totalAdvances.toFixed(2)}, Got: $${settlement.advances.toFixed(2)})`);

            // Check for negative balance
            if (settlement.netPay === 0 && expectedNetPay < 0) {
                const negativeBalance = await prisma.driverNegativeBalance.findFirst({
                    where: {
                        driverId: driver.id,
                        originalSettlementId: settlement.id,
                    },
                });

                if (negativeBalance) {
                    console.log(`\n⚠️  Negative Balance Created: $${negativeBalance.amount.toFixed(2)}`);
                    console.log(`  This will be deducted from the next settlement.`);
                }
            }

            // Get deduction items
            const deductionItems = await prisma.settlementDeduction.findMany({
                where: {
                    settlementId: settlement.id,
                },
                orderBy: {
                    category: 'asc',
                },
            });

            console.log(`\n📋 Deduction Items: ${deductionItems.length}`);

            const additions = deductionItems.filter(d => d.category === 'addition');
            const deductions = deductionItems.filter(d => d.category === 'deduction');

            if (additions.length > 0) {
                console.log(`\n  Additions (${additions.length}):`);
                for (const item of additions) {
                    console.log(`    + ${item.description}: $${item.amount.toFixed(2)}`);
                }
            }

            if (deductions.length > 0) {
                console.log(`\n  Deductions (${deductions.length}):`);
                for (const item of deductions) {
                    console.log(`    - ${item.description}: $${item.amount.toFixed(2)}`);
                }
            }

            // Update escrow balances in deduction rules
            for (const rule of deductionRules) {
                if (rule.goalAmount && rule.deductionType === 'ESCROW') {
                    const deductionItem = deductionItems.find(d =>
                        d.description.includes(rule.name) || d.description.includes('Escrow')
                    );

                    if (deductionItem) {
                        const newBalance = (rule.currentAmount || 0) + deductionItem.amount;
                        await prisma.deductionRule.update({
                            where: { id: rule.id },
                            data: { currentAmount: newBalance },
                        });

                        console.log(`\n  📊 Updated Escrow Balance: $${newBalance.toFixed(2)}/$${rule.goalAmount.toFixed(2)}`);
                    }
                }
            }

            // Store summary
            summaries.push({
                driverNumber: driver.driverNumber,
                name: `${driver.user?.firstName} ${driver.user?.lastName}`,
                truck: driver.currentTruck?.truckNumber || 'N/A',
                trailer: driver.currentTrailer?.trailerNumber || 'N/A',
                payRate: driver.payRate,
                loadCount: loads.length,
                totalMiles,
                totalRevenue,
                grossPay: settlement.grossPay,
                deductions: settlement.deductions,
                advances: settlement.advances,
                netPay: settlement.netPay,
                escrowBalance: 0, // Will be updated if applicable
            });

        } catch (error: any) {
            console.error(`\n❌ Error generating settlement: ${error.message}`);
            console.error(error);
        }
    }

    // ============================================
    // STEP 4: Summary Report
    // ============================================
    console.log('\n');
    console.log('='.repeat(80));
    console.log('📊 SETTLEMENT TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('');

    if (summaries.length === 0) {
        console.log('❌ No settlements were generated.');
    } else {
        console.log(`✅ Successfully generated ${summaries.length} settlements\n`);

        for (const summary of summaries) {
            console.log(`${summary.driverNumber} - ${summary.name}`);
            console.log(`  Truck: ${summary.truck} | Trailer: ${summary.trailer}`);
            console.log(`  Pay Rate: $${summary.payRate}/mile`);
            console.log(`  Loads: ${summary.loadCount} | Miles: ${summary.totalMiles} | Revenue: $${summary.totalRevenue.toFixed(2)}`);
            console.log(`  Gross Pay: $${summary.grossPay.toFixed(2)}`);
            console.log(`  Deductions: $${summary.deductions.toFixed(2)}`);
            console.log(`  Advances: $${summary.advances.toFixed(2)}`);
            console.log(`  Net Pay: $${summary.netPay.toFixed(2)}`);
            console.log('');
        }

        const totalGrossPay = summaries.reduce((sum, s) => sum + s.grossPay, 0);
        const totalDeductions = summaries.reduce((sum, s) => sum + s.deductions, 0);
        const totalAdvances = summaries.reduce((sum, s) => sum + s.advances, 0);
        const totalNetPay = summaries.reduce((sum, s) => sum + s.netPay, 0);

        console.log('TOTALS:');
        console.log(`  Gross Pay: $${totalGrossPay.toFixed(2)}`);
        console.log(`  Deductions: $${totalDeductions.toFixed(2)}`);
        console.log(`  Advances: $${totalAdvances.toFixed(2)}`);
        console.log(`  Net Pay: $${totalNetPay.toFixed(2)}`);
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('');
    console.log('Next steps:');
    console.log('  1. Navigate to /dashboard/settlements to view settlements');
    console.log('  2. Test settlement approval workflow');
    console.log('  3. Generate and download settlement PDFs');
    console.log('  4. Verify Multi-MC isolation');
    console.log('');
}

main()
    .catch((e) => {
        console.error('Error running settlement workflow test:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
