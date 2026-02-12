import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const customers = await prisma.customer.findMany({
            take: 1,
            select: {
                id: true,
                taxRate: true,
            },
        });
        console.log('SUCCESS: taxRate column exists.');
        console.log('Sample data:', customers);
    } catch (error: any) {
        console.error('FAILURE: taxRate column does not exist or error occurred.');
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
