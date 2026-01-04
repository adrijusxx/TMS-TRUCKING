/**
 * Prisma Migration Resolve Script
 * 
 * Usage: node scripts/resolve-migration.js <migration-name> [--rolled-back]
 * 
 * Examples:
 *   node scripts/resolve-migration.js 20250127000001_add_driver_financial_fields --rolled-back
 *   node scripts/resolve-migration.js 20250127000001_add_driver_financial_fields --applied
 */

const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { spawn } = require("child_process");

const REGION = "us-east-1";

async function getSecret(client, secretName) {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        return response.SecretString;
    } catch (error) {
        console.warn(`[Resolve] Warning: Could not fetch secret ${secretName}: ${error.message}`);
        return null;
    }
}

async function buildDatabaseUrl(rdsSecretJson) {
    const secret = JSON.parse(rdsSecretJson);
    const endpoint = "tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com";
    const port = 5432;
    const dbname = "tms_database";
    const encodedPassword = encodeURIComponent(secret.password);
    return `postgresql://${secret.username}:${encodedPassword}@${endpoint}:${port}/${dbname}?sslmode=require`;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log("Usage: node scripts/resolve-migration.js <migration-name> <--rolled-back|--applied>");
        console.log("");
        console.log("Examples:");
        console.log("  node scripts/resolve-migration.js 20250127000001_add_driver_financial_fields --rolled-back");
        console.log("  node scripts/resolve-migration.js 20250127000001_add_driver_financial_fields --applied");
        process.exit(1);
    }

    const migrationName = args[0];
    const action = args[1]; // --rolled-back or --applied

    if (action !== "--rolled-back" && action !== "--applied") {
        console.error("Error: Action must be --rolled-back or --applied");
        process.exit(1);
    }

    console.log(`[Resolve] Initializing AWS Secrets Manager Client (${REGION})...`);
    const client = new SecretsManagerClient({ region: REGION });
    const env = { ...process.env };

    const rdsSecretName = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
    console.log(`[Resolve] Fetching RDS Secret: ${rdsSecretName}`);

    const rdsSecretValue = await getSecret(client, rdsSecretName);

    if (rdsSecretValue) {
        env.DATABASE_URL = await buildDatabaseUrl(rdsSecretValue);
        console.log("[Resolve] DATABASE_URL constructed successfully.");
    } else {
        console.error("[Resolve] CRITICAL: Failed to load RDS Secret.");
        process.exit(1);
    }

    const command = "npx";
    const prismaArgs = ["prisma@6.19.0", "migrate", "resolve", action, migrationName];

    console.log(`[Resolve] Executing: ${command} ${prismaArgs.join(" ")}`);

    const resolve = spawn(command, prismaArgs, {
        stdio: "inherit",
        env: env,
        shell: true
    });

    resolve.on("close", (code) => {
        console.log(`[Resolve] Process exited with code ${code}`);
        process.exit(code);
    });
}

main().catch((err) => {
    console.error("[Resolve] Fatal Error:", err);
    process.exit(1);
});
