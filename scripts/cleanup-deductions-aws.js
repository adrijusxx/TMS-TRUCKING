/**
 * Cleanup Contaminated Settlement Deductions on AWS Database
 * 
 * This script:
 * 1. Connects to AWS RDS using secrets
 * 2. Finds SettlementDeduction records where description contains a driver number
 *    that doesn't match the settlement's driver
 * 3. Deletes the contaminated records
 */

const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { PrismaClient } = require("@prisma/client");

const RDS_SECRET_NAME = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
const REGION = "us-east-1";

async function main() {
    console.log("🔄 Loading secrets from AWS Secrets Manager...");

    const client = new SecretsManagerClient({ region: REGION });
    const command = new GetSecretValueCommand({ SecretId: RDS_SECRET_NAME });
    const response = await client.send(command);

    if (!response.SecretString) {
        throw new Error("Secret has no string value");
    }

    const secret = JSON.parse(response.SecretString);
    const endpoint = "tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com";
    const port = 5432;
    const dbname = "tms_database";
    const encodedPassword = encodeURIComponent(secret.password);

    const databaseUrl = `postgresql://${secret.username}:${encodedPassword}@${endpoint}:${port}/${dbname}?sslmode=require`;

    process.env.DATABASE_URL = databaseUrl;
    console.log("✅ Connected to AWS RDS");
    console.log(`   Host: ${endpoint}`);
    console.log(`   Database: ${dbname}\n`);

    const prisma = new PrismaClient();

    try {
        console.log("🔍 Finding contaminated settlement deductions...\n");

        // Get all settlement deductions with their settlement and driver info
        const allDeductions = await prisma.settlementDeduction.findMany({
            include: {
                settlement: {
                    include: {
                        driver: {
                            select: { driverNumber: true }
                        }
                    }
                }
            }
        });

        const driverNumberPattern = /DRV-[A-Z]{2}-[A-Z]+-\d+/g;
        const contaminated = [];

        for (const deduction of allDeductions) {
            const matches = deduction.description?.match(driverNumberPattern);

            if (matches && matches.length > 0) {
                const settlementDriverNumber = deduction.settlement?.driver?.driverNumber;

                // If the description contains a driver number that doesn't match the settlement's driver
                const containsThisDriver = matches.some(num => num === settlementDriverNumber);

                if (!containsThisDriver) {
                    contaminated.push({
                        id: deduction.id,
                        description: deduction.description,
                        settlementId: deduction.settlementId,
                        settlementDriver: settlementDriverNumber,
                        foundDrivers: matches,
                    });
                }
            }
        }

        console.log(`Found ${contaminated.length} contaminated deductions:\n`);

        if (contaminated.length === 0) {
            console.log("✅ No contaminated deductions found! Database is clean.");
            return;
        }

        // Show what we found
        for (const d of contaminated.slice(0, 20)) { // Show first 20
            console.log(`  ❌ "${d.description}"`);
            console.log(`     Settlement driver: ${d.settlementDriver}`);
            console.log(`     Found in description: ${d.foundDrivers.join(', ')}\n`);
        }

        if (contaminated.length > 20) {
            console.log(`  ... and ${contaminated.length - 20} more.\n`);
        }

        // Delete contaminated records
        console.log(`\n🗑️  Deleting ${contaminated.length} contaminated records...\n`);

        const deleteResult = await prisma.settlementDeduction.deleteMany({
            where: {
                id: { in: contaminated.map(d => d.id) }
            }
        });

        console.log(`✅ Deleted ${deleteResult.count} contaminated deduction records!`);

        // Recalculate affected settlements
        const affectedSettlementIds = [...new Set(contaminated.map(d => d.settlementId))];
        console.log(`\n🔧 Recalculating ${affectedSettlementIds.length} affected settlements...\n`);

        for (const settlementId of affectedSettlementIds) {
            // Get remaining deductions for this settlement
            const remainingDeductions = await prisma.settlementDeduction.findMany({
                where: {
                    settlementId,
                    OR: [
                        { category: 'deduction' },
                        { category: null, deductionType: { notIn: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] } }
                    ]
                }
            });

            const remainingAdditions = await prisma.settlementDeduction.findMany({
                where: {
                    settlementId,
                    OR: [
                        { category: 'addition' },
                        { deductionType: { in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] } }
                    ]
                }
            });

            const totalDeductions = remainingDeductions.reduce((sum, d) => sum + d.amount, 0);
            const totalAdditions = remainingAdditions.reduce((sum, a) => sum + a.amount, 0);

            const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } });

            if (settlement) {
                const netPay = settlement.grossPay + totalAdditions - totalDeductions - (settlement.advances || 0);

                await prisma.settlement.update({
                    where: { id: settlementId },
                    data: {
                        deductions: totalDeductions,
                        netPay: netPay < 0 ? 0 : netPay
                    }
                });
            }
        }

        console.log("✅ Settlement recalculation completed!");
        console.log("\n🎉 Cleanup finished successfully!");

    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
