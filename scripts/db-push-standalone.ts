
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { execSync } from 'child_process';

// Hardcoded from screenshot
const RDS_SECRET_NAME = 'rds!db-6748f518-a7ef-42a5-a907-001d82f38a16';

async function getSecret(secretName: string, region: string): Promise<string> {
    try {
        const client = new SecretsManagerClient({ region });
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        return response.SecretString || '';
    } catch (error: any) {
        console.warn(`[${region}] failed to fetch ${secretName}: ${error.name} - ${error.message}`);
        return '';
    }
}

function buildConnectionStringFromRdsSecret(rdsSecretJson: string): string {
    try {
        const secret = JSON.parse(rdsSecretJson);
        const { username, password, host, port, dbname } = secret;
        const encodedPassword = encodeURIComponent(password);
        return `postgresql://${username}:${encodedPassword}@${host}:${port}/${dbname}?sslmode=require`;
    } catch (error) {
        throw new Error(`Failed to parse RDS secret JSON: ${error}`);
    }
}

async function main() {
    console.log(`🔄 Fetching secret: ${RDS_SECRET_NAME}...`);

    try {
        let rdsSecretJson = '';

        // Try current region first (eu-west-1)
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
            console.error('❌ Could not find secret in eu-west-1 or us-east-1.');
            process.exit(1);
        }

        console.log('✅ Connection string built. Running prisma db push...');
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
