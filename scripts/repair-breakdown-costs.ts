import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairBreakdownCosts() {
    console.log('Starting breakdown cost repair...');

    const breakdowns = await prisma.breakdown.findMany({
        select: {
            id: true,
            breakdownNumber: true,
            repairCost: true,
            towingCost: true,
            laborCost: true,
            partsCost: true,
            otherCosts: true,
            totalCost: true,
        }
    });

    console.log(`Found ${breakdowns.length} breakdowns to audit.`);

    let fixedCount = 0;

    for (const b of breakdowns) {
        const sum =
            (b.repairCost || 0) +
            (b.towingCost || 0) +
            (b.laborCost || 0) +
            (b.partsCost || 0) +
            (b.otherCosts || 0);

        if (b.totalCost !== sum) {
            console.log(`Updating ${b.breakdownNumber}: ${b.totalCost} -> ${sum}`);
            await prisma.breakdown.update({
                where: { id: b.id },
                data: { totalCost: sum }
            });
            fixedCount++;
        }
    }

    console.log(`Finished. Fixed ${fixedCount} breakdowns.`);
}

repairBreakdownCosts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
