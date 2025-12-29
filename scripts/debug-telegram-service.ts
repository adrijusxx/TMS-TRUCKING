
import { getTelegramService } from '../lib/services/TelegramService';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Importing TelegramService...');

    try {
        const service = getTelegramService();
        console.log('TelegramService instantiated successfully.');

        console.log('Checking connection status...');
        const status = await service.getConnectionStatus();
        console.log('Connection Status:', status);

    } catch (error: any) {
        console.error('Error with TelegramService:', error);
        if (error.stack) {
            console.error(error.stack);
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
