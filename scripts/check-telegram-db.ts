
import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- Checking DB State ---');

    // 1. Check Settings
    const settings = await prisma.telegramSettings.findFirst();
    console.log('Global Settings:', settings);

    // 2. Check Mapping for ID 1077141699
    const telegramId = '1077141699';
    const mapping = await prisma.telegramDriverMapping.findUnique({
        where: { telegramId },
        include: { driver: true }
    });
    console.log('Mapping:', mapping);

    // 3. Check AI Logs
    const logs = await prisma.aIResponseLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { communication: true }
    });
    console.log('Latest AI Logs:', JSON.stringify(logs, null, 2));

    if (mapping) {
        console.log('AI Enabled:', mapping.aiAutoReply);
        console.log('Driver Linked:', !!mapping.driver);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
