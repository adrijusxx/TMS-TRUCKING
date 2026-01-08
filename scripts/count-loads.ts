import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.load.count();
    console.log('Total loads in DB:', count);

    if (count > 0) {
        const sample = await prisma.load.findMany({
            take: 5,
            select: { loadNumber: true, companyId: true }
        });
        console.log('Sample:', JSON.stringify(sample, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
