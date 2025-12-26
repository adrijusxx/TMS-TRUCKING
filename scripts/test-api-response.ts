import { PrismaClient, BreakdownStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateFullAPIResponse() {
    const firstCompany = await prisma.company.findFirst();
    if (!firstCompany) return;

    const where = {
        companyId: firstCompany.id,
        deletedAt: null,
        status: {
            notIn: [BreakdownStatus.RESOLVED, BreakdownStatus.CANCELLED],
        },
    };

    const breakdowns = await prisma.breakdown.findMany({
        where,
        include: {
            truck: {
                select: {
                    id: true,
                    truckNumber: true,
                },
            },
            payments: {
                select: {
                    amount: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
    });

    const breakdownsWithTimeElapsed = breakdowns.map((breakdown) => {
        const totalPaid = breakdown.payments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0;
        return {
            id: breakdown.id,
            breakdownNumber: breakdown.breakdownNumber,
            totalCost: breakdown.totalCost,
            totalPaid,
            truck: breakdown.truck,
        };
    });

    console.log('API Response (as JSON):');
    console.log(JSON.stringify({ breakdowns: breakdownsWithTimeElapsed }, null, 2));
}

simulateFullAPIResponse()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
