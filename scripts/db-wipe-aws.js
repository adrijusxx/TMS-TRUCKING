const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { execSync } = require("child_process");

// Same secret name as db-push-aws.js
const RDS_SECRET_NAME = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
const REGION = "us-east-1";

async function main() {
    console.log("🔄 Loading secrets from AWS Secrets Manager for DATABASE WIPE...");
    console.log(`📥 Using secret: ${RDS_SECRET_NAME}`);

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
    console.log("✅ DATABASE_URL built from RDS secret");
    console.log(`   Host: ${endpoint}`);
    console.log(`   User: ${secret.username}`);
    console.log(`   Database: ${dbname}`);

    console.log("⚠️  WARNING: This will wipe DATA from the AWS database while keeping the schema!");
    console.log("🚀 Running reset-database script via tsx...");

    // Using npx tsx to run the existing reset-database.ts script with the AWS environment
    execSync("npx tsx scripts/reset-database.ts", {
        stdio: "inherit",
        env: process.env
    });

    console.log("✅ Database wipe completed successfully!");
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
