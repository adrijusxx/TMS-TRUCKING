import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectBreakdown(breakdownNumber: string) {
    const breakdown = await prisma.breakdown.findUnique({
        where: { breakdownNumber },
        include: {
            truck: true
        }
    });

    if (!breakdown) {
        console.log(`Breakdown ${breakdownNumber} not found.`);
        return;
    }

    console.log('Breakdown Details:');
    console.log(`Number: ${breakdown.breakdownNumber}`);
    console.log(`Status: ${breakdown.status}`);
    console.log(`Repair Cost: ${breakdown.repairCost}`);
    console.log(`Towing Cost: ${breakdown.towingCost}`);
    console.log(`Labor Cost: ${breakdown.laborCost}`);
    console.log(`Parts Cost: ${breakdown.partsCost}`);
    console.log(`Other Costs: ${breakdown.otherCosts}`);
    console.log(`Total Cost: ${breakdown.totalCost}`);

    const sum =
        (breakdown.repairCost || 0) +
        (breakdown.towingCost || 0) +
        (breakdown.laborCost || 0) +
        (breakdown.partsCost || 0) +
        (breakdown.otherCosts || 0);

    console.log(`Calculated Sum: ${sum}`);
}

inspectBreakdown('BD-345-0007')
    .catch(console.error)
    .finally(() => prisma.$disconnect());
