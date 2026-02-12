
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PAY_PER_MILE = 0.65;
const CHUNK_SIZE = 5; // Very safe chunk size

async function fixDriverPay() {
    console.log(`Starting driver pay fix with $${PAY_PER_MILE}/mile...`);

    const loads = await prisma.load.findMany({
        where: {
            AND: [
                { driverPay: { not: null } },
                { revenue: { not: 0 } },
            ]
        },
        select: {
            id: true,
            revenue: true,
            driverPay: true,
            totalMiles: true,
            loadedMiles: true
        }
    });

    const loadsToFix = loads.filter(l => l.driverPay === l.revenue);
    console.log(`Found ${loadsToFix.length} loads to fix.`);

    let updatedCount = 0;

    for (let i = 0; i < loadsToFix.length; i += CHUNK_SIZE) {
        const chunk = loadsToFix.slice(i, i + CHUNK_SIZE);

        await Promise.all(chunk.map(async (load) => {
            try {
                const miles = load.totalMiles || load.loadedMiles || 0;
                const newDriverPay = Math.round(miles * PAY_PER_MILE * 100) / 100;
                const newProfit = Math.round((load.revenue - newDriverPay) * 100) / 100;

                await prisma.load.update({
                    where: { id: load.id },
                    data: {
                        driverPay: newDriverPay,
                        profit: newProfit,
                        netProfit: newProfit
                    }
                });
            } catch (err) {
                console.error(`Failed to update load ${load.id}:`, err);
            }
        }));

        updatedCount += chunk.length;
        if (updatedCount % 100 === 0 || updatedCount === loadsToFix.length) {
            console.log(`Updated ${updatedCount}/${loadsToFix.length}...`);
        }
    }

    console.log(`Finished. Total updated: ${updatedCount}`);
}

fixDriverPay()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
