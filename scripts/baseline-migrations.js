const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { Client } = require("pg");

const REGION = "us-east-1";
const RDS_SECRET_NAME = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
const DB_HOST = "tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com";
const DB_NAME = "tms_database";

const MIGRATIONS = [
    "20260214164426_initial_schema",
    "20260215122006_add_import_features",
    "20260217140147_optimize_load_schema_and_add_tracking",
    "20260217142257_finalize_load_optimization",
    "20260217182805_add_load_tripid_stopscount_lastnote_otd_lastupdate",
    "20260220170000_sync_schema_with_database",
];

async function main() {
    console.log("[Baseline] Loading credentials from AWS Secrets Manager...");
    const sm = new SecretsManagerClient({ region: REGION });
    const res = await sm.send(new GetSecretValueCommand({ SecretId: RDS_SECRET_NAME }));

    if (!res.SecretString) throw new Error("Secret has no string value");
    const secret = JSON.parse(res.SecretString);

    const client = new Client({
        host: DB_HOST,
        port: 5432,
        database: DB_NAME,
        user: secret.username,
        password: secret.password,
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log("[Baseline] Connected to database.");

    // Create _prisma_migrations table if it doesn't exist
    await client.query(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
            id              VARCHAR(36) PRIMARY KEY,
            checksum        VARCHAR(64) NOT NULL,
            finished_at     TIMESTAMPTZ,
            migration_name  VARCHAR(255) NOT NULL UNIQUE,
            logs            TEXT,
            rolled_back_at  TIMESTAMPTZ,
            started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            applied_steps_count INTEGER NOT NULL DEFAULT 0
        )
    `);
    console.log("[Baseline] _prisma_migrations table ready.");

    for (const name of MIGRATIONS) {
        const { rowCount } = await client.query(
            `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
             VALUES (gen_random_uuid(), $1, now(), $2, 1)
             ON CONFLICT (migration_name) DO NOTHING`,
            ["0000000000000000000000000000000000000000000000000000000000000000", name]
        );
        console.log(`[Baseline] ${name}: ${rowCount ? "marked as applied" : "already exists"}`);
    }

    await client.end();
    console.log("[Baseline] Done! All migrations baselined. Future deploys use prisma migrate deploy.");
}

main().catch((err) => {
    console.error("[Baseline] Error:", err);
    process.exit(1);
});
