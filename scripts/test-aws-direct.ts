import { PrismaClient } from '@prisma/client';

async function main() {
    const user = 'tms_admin';
    const password = encodeURIComponent('tUQo19WCTuv|UmaO*Xt|85zliv?i');
    const host = 'tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com';
    const port = '5432';
    const database = 'tms';
    const url = `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;

    console.log('[INFO] Testing direct connection to AWS RDS...');
    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });

    try {
        await prisma.$connect();
        console.log('[SUCCESS] Directly connected to AWS RDS!');
        const count = await prisma.company.count();
        console.log(`[INFO] Companies in AWS: ${count}`);
    } catch (e: any) {
        console.error('[ERROR] Direct connection failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
