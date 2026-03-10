
import { getTelegramService } from '../lib/services/TelegramService';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Importing TelegramService...');

    try {
        // Debug: use a dummy scope for testing
        const scope = { key: 'company:debug', companyId: 'debug', mcNumberId: null, mode: 'COMPANY' as const };
        const service = getTelegramService(scope);
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
