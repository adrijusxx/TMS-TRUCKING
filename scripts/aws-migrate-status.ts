import 'dotenv/config';
import * as path from 'path';
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
import { getRdsDatabaseUrl } from '../lib/secrets/aws-secrets-manager';
import { execSync } from 'child_process';

async function main() {
    try {
        const dbUrl = await getRdsDatabaseUrl();
        console.log('[INFO] AWS RDS URL Fetched.');
        console.log('[INFO] Masked URL:', dbUrl.replace(/:[^:@]+?@/, ':****@'));

        // Execute prisma migrate status with the AWS URL
        console.log('[INFO] Running npx prisma migrate status...');
        const output = execSync(`npx prisma migrate status`, {
            env: { ...process.env, DATABASE_URL: dbUrl },
            encoding: 'utf-8'
        });
        console.log(output);
    } catch (error: any) {
        console.error('[ERROR] Migration status check failed');
        if (error.stdout) console.log(error.stdout);
        if (error.stderr) console.error(error.stderr);
    }
}

main();
