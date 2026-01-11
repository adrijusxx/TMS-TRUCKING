
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { execSync } from 'child_process';

// --- CONFIGURATION REQUIRED ---
// The secret only contains username/password. You must provide the Host.
// Go to AWS Console -> RDS -> Databases -> tms-database -> Connectivity & security -> Endpoint
const RDS_HOST = 'tms-database.cxxxxxxx.us-east-1.rds.amazonaws.com'; // <--- REPLACE THIS WITH YOUR REAL ENDPOINT

// Default database name (usually 'postgres' or the name you gave when creating it)
const RDS_DB_NAME = 'postgres';

// Secret ARN
const RDS_SECRET_NAME = 'rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16';

async function getSecret(secretName: string, region: string): Promise<string> {
    try {
        const client = new SecretsManagerClient({ region });
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        return response.SecretString || '';
    } catch (error: any) {
        return '';
    }
}

function buildConnectionStringFromRdsSecret(rdsSecretJson: string): string {
    try {
        const secret = JSON.parse(rdsSecretJson);
        console.log('📝 Secret Keys found:', Object.keys(secret));

        // Use manual host if not in secret
        const host = secret.host || secret.hostname || RDS_HOST;
        // Use manual dbname if not in secret
        const dbname = secret.dbname || secret.database || secret.db || RDS_DB_NAME;
        const port = (secret.port && !isNaN(Number(secret.port))) ? secret.port : 5432;

        const username = secret.username || secret.user;
        const password = secret.password;

        if (host.includes('cxxxxxxx')) {
            console.error('❌ ERROR: You must update RDS_HOST in the script with the real endpoint!');
            process.exit(1);
        }

        if (!username || !password) {
            throw new Error(`Missing username/password in secret.`);
        }

        const encodedPassword = encodeURIComponent(password);
        console.log(`🔗 Generated URL structure: postgresql://${username}:***@${host}:${port}/${dbname}`);

        return `postgresql://${username}:${encodedPassword}@${host}:${port}/${dbname}?sslmode=require`;
    } catch (error) {
        throw new Error(`Failed to parse RDS secret JSON: ${error}`);
    }
}

async function main() {
    console.log(`🔄 Fetching secret: ${RDS_SECRET_NAME}...`);

    try {
        let rdsSecretJson = '';

        // Try current region first
        const currentRegion = process.env.AWS_REGION || 'eu-west-1';
        rdsSecretJson = await getSecret(RDS_SECRET_NAME, currentRegion);

        // If not found, try us-east-1
        if (!rdsSecretJson && currentRegion !== 'us-east-1') {
            console.log('⚠️  Not found in ' + currentRegion + ', trying us-east-1...');
            rdsSecretJson = await getSecret(RDS_SECRET_NAME, 'us-east-1');
        }

        if (rdsSecretJson) {
            console.log('✅ Found secret!');
            const url = buildConnectionStringFromRdsSecret(rdsSecretJson);
            process.env.DATABASE_URL = url;
            process.env.DATABASE_URL_MIGRATE = url;
        } else {
            console.error('❌ Could not find secret.');
            process.exit(1);
        }

        console.log('✅ Secrets loaded. Running prisma db push...');
        execSync('npx prisma@6.19.0 db push', {
            stdio: 'inherit',
            env: process.env
        });
        console.log('✅ Database push completed successfully.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
