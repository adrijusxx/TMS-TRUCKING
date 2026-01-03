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
        console.warn(`[Migration] Warning: Could not fetch secret ${secretName}: ${error.message}`);
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

const fs = require('fs');
const path = require('path');

async function main() {
    console.log(`[Migration] Initializing AWS Secrets Manager Client (${REGION})...`);
    const client = new SecretsManagerClient({ region: REGION });
    const env = { ...process.env };

    const rdsSecretName = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
    console.log(`[Migration] Fetching RDS Secret: ${rdsSecretName}`);

    const rdsSecretValue = await getSecret(client, rdsSecretName);

    if (rdsSecretValue) {
        env.DATABASE_URL = await buildDatabaseUrl(rdsSecretValue);
        env.DATABASE_URL_MIGRATE = env.DATABASE_URL;
        console.log("[Migration] DATABASE_URL constructed successfully.");
    } else {
        console.error("[Migration] CRITICAL: Failed to load RDS Secret.");
        process.exit(1);
    }

    // Determine correct Prisma binary to avoid version mismatch (v7 vs v6)
    let command = "npx";
    let args = ["prisma", "migrate", "deploy"];

    // Check for local binary (works on Linux/AWS)
    const localBinUnix = path.join(process.cwd(), "node_modules", ".bin", "prisma");
    // Check for local binary (works on Windows)
    const localBinWin = path.join(process.cwd(), "node_modules", ".bin", "prisma.cmd");

    if (fs.existsSync(localBinUnix)) {
        console.log(`[Migration] Using local Prisma binary: ${localBinUnix}`);
        command = localBinUnix;
        args = ["migrate", "deploy"];
    } else if (process.platform === "win32" && fs.existsSync(localBinWin)) {
        console.log(`[Migration] Using local Prisma binary: ${localBinWin}`);
        command = localBinWin;
        args = ["migrate", "deploy"];
    } else {
        console.warn("[Migration] WARNING: Local Prisma binary not found. Falling back to global npx (risk of version mismatch).");
        console.warn("[Migration] suggestion: Run 'npm install' to ensure dependencies are present.");
    }

    console.log(`[Migration] Executing: ${command} ${args.join(" ")}`);

    const migration = spawn(command, args, {
        stdio: "inherit",
        env: env,
        shell: true
    });

    migration.on("close", (code) => {
        console.log(`[Migration] Process exited with code ${code}`);
        process.exit(code);
    });
}

main().catch((err) => {
    console.error("[Migration] Fatal Error:", err);
    process.exit(1);
});
