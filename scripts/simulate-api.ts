import { PrismaClient, BreakdownStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateActiveBreakdownsAPI() {
    const companyId = 'clkq9j1n300003b6m7z9j1n30'; // I'll search for the real company ID or just use findFirst

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
            payments: {
                select: {
                    amount: true,
                },
            },
        }
    });

    const processed = breakdowns.map((b) => {
        const totalPaid = b.payments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0;
        return {
            breakdownNumber: b.breakdownNumber,
            totalCost: b.totalCost,
            totalPaid,
        };
    });

    console.log(JSON.stringify(processed, null, 2));
}

simulateActiveBreakdownsAPI()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
