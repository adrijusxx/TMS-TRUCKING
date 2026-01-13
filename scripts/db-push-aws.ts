
import { execSync } from 'child_process';
import { initializeSecrets } from '@/lib/secrets/initialize';

async function main() {
    try {
        console.log('🔄 Initializing secrets from AWS Secrets Manager...');
        // This will fetch secrets and set process.env.DATABASE_URL
        await initializeSecrets();

        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL was not found in secrets!');
            process.exit(1);
        }

        console.log('✅ Secrets loaded. Running prisma db push...');

        // Explicitly pass the env to the child process, though it inherits by default
        execSync('npx prisma@6.19.0 db push', {
            stdio: 'inherit',
            env: process.env
        });

        console.log('✅ Database push completed successfully.');
    } catch (error) {
        console.error('❌ Error during db push:', error);
        process.exit(1);
    }
}

main();
