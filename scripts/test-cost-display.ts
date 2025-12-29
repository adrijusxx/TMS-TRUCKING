import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNewestBreakdown() {
    const breakdown = await prisma.breakdown.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    if (!breakdown) {
        console.log('No breakdowns found');
        return;
    }

    console.log(`Breakdown: ${breakdown.breakdownNumber}`);
    console.log(`Raw database value:`);
    console.log(`totalCost: ${breakdown.totalCost}`);
    console.log(`typeof totalCost: ${typeof breakdown.totalCost}`);
    console.log(`JSON.stringify: ${JSON.stringify(breakdown.totalCost)}`);
    console.log(`toFixed(0): ${breakdown.totalCost?.toFixed(0)}`);
    console.log(`String interpolation: $${breakdown.totalCost?.toFixed(0) || 0}`);

    // Test if it's being stored as string
    const asString = String(breakdown.totalCost);
    console.log(`\nAs string: "${asString}"`);
    console.log(`String + '0': "${asString}0"`);

    // Check individual costs
    console.log(`\nIndividual costs:`);
    console.log(`repairCost: ${breakdown.repairCost}`);
    console.log(`towingCost: ${breakdown.towingCost}`);
    console.log(`laborCost: ${breakdown.laborCost}`);
    console.log(`partsCost: ${breakdown.partsCost}`);
    console.log(`otherCosts: ${breakdown.otherCosts}`);
}

testNewestBreakdown()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
