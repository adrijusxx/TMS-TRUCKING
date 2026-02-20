const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { execSync } = require("child_process");

const REGION = "us-east-1";

async function main() {
    console.log("[Baseline] Loading AWS Secrets Manager...");
    const client = new SecretsManagerClient({ region: REGION });

    const rdsSecretName = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
    const command = new GetSecretValueCommand({ SecretId: rdsSecretName });
    const response = await client.send(command);

    if (!response.SecretString) throw new Error("Secret has no string value");

    const secret = JSON.parse(response.SecretString);
    const endpoint = "tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com";
    const encodedPassword = encodeURIComponent(secret.password);
    const databaseUrl = `postgresql://${secret.username}:${encodedPassword}@${endpoint}:5432/tms_database?sslmode=require`;

    process.env.DATABASE_URL = databaseUrl;
    console.log("[Baseline] DATABASE_URL set.");

    const migrations = [
        "20260214164426_initial_schema",
        "20260215122006_add_import_features",
        "20260217140147_optimize_load_schema_and_add_tracking",
        "20260217142257_finalize_load_optimization",
        "20260217182805_add_load_tripid_stopscount_lastnote_otd_lastupdate",
        "20260220170000_sync_schema_with_database",
    ];

    for (const migration of migrations) {
        console.log(`[Baseline] Marking as applied: ${migration}`);
        try {
            execSync(`npx prisma@6.19.0 migrate resolve --applied ${migration}`, {
                stdio: "inherit",
                env: process.env,
            });
        } catch (err) {
            console.warn(`[Baseline] Warning for ${migration}: ${err.message}`);
        }
    }

    console.log("[Baseline] All migrations baselined. Future deploys will use migrate deploy.");
}

main().catch((err) => {
    console.error("[Baseline] Error:", err);
    process.exit(1);
});
