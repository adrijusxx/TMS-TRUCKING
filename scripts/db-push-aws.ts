
import { execSync } from 'child_process';

// Hardcoded RDS Secret ARN - update this if it changes
const RDS_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:842822459362:secret:rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16-W8xe28';

async function loadSecretsAndPush() {
    try {
        console.log('🔄 Loading secrets from AWS Secrets Manager...');
        console.log(`📥 Using secret: ${RDS_SECRET_ARN}`);

        const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');

        const client = new SecretsManagerClient({ region: 'us-east-1' });

        const command = new GetSecretValueCommand({ SecretId: RDS_SECRET_ARN });
        const response = await client.send(command);

        if (!response.SecretString) {
            throw new Error('Secret has no string value');
        }

        const secret = JSON.parse(response.SecretString);
        const { username, password, host, port, dbname } = secret;

        // Build connection string with URL-encoded password
        const encodedPassword = encodeURIComponent(password);
        const databaseUrl = `postgresql://${username}:${encodedPassword}@${host}:${port}/${dbname || 'postgres'}?sslmode=require`;

        process.env.DATABASE_URL = databaseUrl;
        console.log('✅ DATABASE_URL built from RDS secret');
        console.log(`   Host: ${host}`);
        console.log(`   User: ${username}`);
        console.log(`   Database: ${dbname || 'postgres'}`);

        console.log('🚀 Running prisma db push...');
        execSync('npx prisma@6.19.0 db push', {
            stdio: 'inherit',
            env: process.env
        });

        console.log('✅ Database push completed successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

loadSecretsAndPush();
