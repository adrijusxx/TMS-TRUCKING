
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLoads() {
    const loads = await prisma.load.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            loadNumber: true,
            revenue: true,
            driverPay: true,
            totalMiles: true,
            createdAt: true
        }
    });

    console.log('--- Sample Load Data ---');
    loads.forEach(l => {
        const payPerMile = l.totalMiles ? (l.driverPay || 0) / l.totalMiles : 0;
        console.log(`Load: ${l.loadNumber} | Revenue: $${l.revenue} | Driver Pay: $${l.driverPay} | Miles: ${l.totalMiles} | Calculated $/Mile: $${payPerMile.toFixed(2)}`);
    });
}

checkLoads().catch(console.error).finally(() => prisma.$disconnect());
