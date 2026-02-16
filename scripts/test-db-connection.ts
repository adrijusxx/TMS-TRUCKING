import * as path from 'path';
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
import { PrismaClient } from '@prisma/client';
import { getRdsDatabaseUrl, verifyAwsConnectivity } from '../lib/secrets/aws-secrets-manager';

async function main() {
    console.log('---------------------------------------------------------');
    console.log('🔍 PRISMA & AWS CONNECTION DIAGNOSTIC TOOL');
    console.log('---------------------------------------------------------');

    // 1. Check AWS Connectivity First
    console.log('[INFO] Checking AWS SDK connectivity...');
    const awsStatus = await verifyAwsConnectivity();
    console.log(`[INFO] AWS Secrets Access: ${awsStatus.secrets ? '✅ OK' : '❌ FAILED'}`);
    console.log(`[INFO] AWS RDS Secret Configured: ${awsStatus.rdsReady ? '✅ OK' : '⚠️ Missing env'}`);

    // 2. Determine which DB URL to use
    let dbUrl = process.env.DATABASE_URL || '';

    if (awsStatus.rdsReady && awsStatus.secrets) {
        console.log('[INFO] Detected AWS Secret configuration. Attempting to fetch RDS URL...');
        try {
            const rdsUrl = await getRdsDatabaseUrl();
            console.log('[SUCCESS] Successfully retrieved DB URL from AWS Secrets Manager.');
            dbUrl = rdsUrl;
        } catch (err: any) {
            console.warn('[WARN] Failed to fetch secret-based URL, falling back to local .env');
            console.warn(`[REASON] ${err.message}`);
        }
    }

    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`[INFO] TARGET DATABASE: ${maskedUrl}`);

    if (!dbUrl) {
        console.error('[ERROR] No DATABASE_URL available via .env or AWS Secrets!');
        process.exit(1);
    }

    console.log('[INFO] Initializing PrismaClient...');
    const prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } },
        log: ['error'], // Keep logs quiet for this test
    });

    try {
        console.log('[INFO] Attempting to connect...');
        await prisma.$connect();
        console.log('[SUCCESS] Successfully established database connection!');

        const count = await prisma.company.count();
        console.log(`[INFO] Query Check: Found ${count} companies.`);

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
