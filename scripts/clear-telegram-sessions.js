const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTelegramSessions() {
    try {
        console.log('Clearing all Telegram sessions...');

        const result = await prisma.telegramSession.deleteMany({});

        console.log(`✅ Deleted ${result.count} Telegram session(s)`);
        console.log('You can now connect Telegram with a fresh start!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearTelegramSessions();
