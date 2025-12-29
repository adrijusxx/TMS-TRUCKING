
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Checking TelegramSettings table...');
    try {
        const count = await prisma.telegramSettings.count();
        console.log(`Success! Found ${count} TelegramSettings records.`);
    } catch (error: any) {
        console.error('Error querying TelegramSettings:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }

    console.log('\nChecking TelegramSession table...');
    try {
        const count = await prisma.telegramSession.count();
        console.log(`Success! Found ${count} TelegramSession records.`);
    } catch (error: any) {
        console.error('Error querying TelegramSession:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
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
