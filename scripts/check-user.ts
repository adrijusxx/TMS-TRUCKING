
import { prisma } from '../lib/prisma';

async function main() {
    const email = 'adrian@fwl2.com';
    console.log(`Checking for user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        console.log('User found:', user);
    } else {
        console.log('User NOT found.');

        // List all users to see if there's a similar one or if the table is empty
        const allUsers = await prisma.user.findMany({
            take: 10,
            select: { id: true, email: true, role: true }
        });
        console.log('Existing users (first 10):');
        console.table(allUsers);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
