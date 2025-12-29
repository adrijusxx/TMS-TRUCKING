const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Helper to get secret from AWS Secrets Manager
function getSecret(secretId) {
    try {
        const result = execSync(
            `aws secretsmanager get-secret-value --secret-id "${secretId}" --region us-east-1 --query SecretString --output text`,
            { encoding: 'utf-8' }
        );
        return JSON.parse(result.trim());
    } catch (e) {
        console.error(`Failed to fetch secret ${secretId}:`, e.message);
        process.exit(1);
    }
}

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Error: Please provide an email address.');
        console.log('Usage: node scripts/assign-super-admin.js <email>');
        process.exit(1);
    }

    // 1. Fetch Database Credentials
    console.log('Fetching database credentials from AWS...');
    const rdsSecret = getSecret('rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16');
    const endpoint = 'tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com';
    const port = '5432';
    const dbname = 'tms_database';

    // 2. Construct DATABASE_URL
    const encodedPassword = encodeURIComponent(rdsSecret.password);
    const databaseUrl = `postgresql://${rdsSecret.username}:${encodedPassword}@${endpoint}:${port}/${dbname}?sslmode=require`;

    // 3. Initialize Prisma with the dynamic URL
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    });

    try {
        console.log(`Looking up user with email: ${email}...`);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`Error: User with email '${email}' not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.firstName} ${user.lastName} (Current Role: ${user.role})`);

        // FIX: Manually add SUPER_ADMIN to enum if it's missing (bypassing broken migration)
        try {
            console.log('Ensuring SUPER_ADMIN role exists in database...');
            await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`);
        } catch (e) {
            // Ignore error if it already exists or if syntax slightly differs (Postgres usually handles ADD VALUE cleanly)
            console.log('Note: Attempted to add SUPER_ADMIN enum value. Proceeding...');
        }

        console.log('Updating role to SUPER_ADMIN...');

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'SUPER_ADMIN' },
        });

        console.log(`✅ Success! User ${updatedUser.email} is now a SUPER_ADMIN.`);
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
