
import { PrismaClient } from '@prisma/client';

async function main() {
    console.log('---------------------------------------------------------');
    console.log('🔍 PRISMA CONNECTION DIAGNOSTIC TOOL');
    console.log('---------------------------------------------------------');
    console.log(`[INFO] NODE_ENV: ${process.env.NODE_ENV}`);

    // Mask DB URL
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`[INFO] DATABASE_URL: ${maskedUrl}`);

    if (!dbUrl) {
        console.error('[ERROR] DATABASE_URL is missing!');
        process.exit(1);
    }

    console.log('[INFO] Initializing PrismaClient...');
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });

    try {
        console.log('[INFO] Attempting to connect to database...');
        await prisma.$connect();
        console.log('[SUCCESS] Successfully connected to the database!');

        // Test a simple read
        console.log('[INFO] Running simple query (SELECT 1)...');
        // Note: $queryRaw`SELECT 1` works on Postgres/MySQL
        try {
            await prisma.$queryRaw`SELECT 1`;
            console.log('[SUCCESS] Query execution successful.');
        } catch (queryError) {
            console.error('[warn] Query failed (might be permissions), but connection worked.');
            console.error(queryError);
        }

        // Check Company Count
        const count = await prisma.company.count();
        console.log(`[INFO] Found ${count} companies in the database.`);

    } catch (e: any) {
        console.error('---------------------------------------------------------');
        console.error('❌ CONNECTION FAILED');
        console.error('---------------------------------------------------------');
        console.error(`Error Code: ${e.code}`);
        console.error(`Message: ${e.message}`);

        if (e.code === 'P1001') {
            console.error('[TIP] P1001: Can\'t reach database server. Check:');
            console.error('      1. Security Groups (AWS) allowing inbound traffic?');
            console.error('      2. Is the database string host correct?');
        }
        else if (e.code === 'P1013') {
            console.error('[TIP] P1013: The provided database string is invalid.');
        }
        else if (e.code === 'P1003') {
            console.error('[TIP] P1003: Database file not found (SQLite) or table missing.');
        }
    } finally {
        await prisma.$disconnect();
        console.log('---------------------------------------------------------');
    }
}

main();
