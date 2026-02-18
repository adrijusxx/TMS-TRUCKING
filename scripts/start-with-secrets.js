const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { spawn } = require("child_process");

// Region where secrets are stored (hardcoded to us-east-1 as per user context)
const REGION = "us-east-1";

// List of secrets to fetch
// Keys are the Secret Name in AWS, Values are the env var(s) to map to
const SECRETS_MAPPING = {
    // RDS Secret: Special handling needed (JSON parsing)
    "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16": "DATABASE_URL",

    // Auth
    "tms/nextauth/secret": "NEXTAUTH_SECRET",
    "tms/nextauth/url": "NEXTAUTH_URL",

    // Google Maps
    "tms/integrations/google/maps-api-key": "GOOGLE_MAPS_API_KEY",
    "tms/integrations/google/maps-public-api-key": "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "tms/integrations/google/maps-places-api-key": "GOOGLE_PLACES_API_KEY",

    // Google Service Account (Sheets)
    "tms/integrations/google/service-account-email": "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "tms/integrations/google/service-account-key": "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",

    // OpenAI
    "tms/integrations/openai/api-key": "OPENAI_API_KEY",

    // DeepSeek
    "tms/integrations/deepseek/api-key": "DEEPSEEK_API_KEY",

    // Samsara
    "tms/integrations/samsara/api-key": "SAMSARA_API_KEY",
    "tms/integrations/samsara/webhook-secret": "SAMSARA_WEBHOOK_SECRET",
    "tms/integrations/samsara/stats-enabled": "SAMSARA_STATS_ENABLED",
    "tms/integrations/samsara/camera-enabled": "SAMSARA_CAMERA_MEDIA_ENABLED",
    "tms/integrations/samsara/trips-enabled": "SAMSARA_TRIPS_ENABLED",

    // Telegram
    "tms/integrations/telegram/api-id": "TELEGRAM_API_ID",
    "tms/integrations/telegram/api-hash": "TELEGRAM_API_HASH",
    "tms/integrations/telegram/encryption-key": "TELEGRAM_SESSION_ENCRYPTION_KEY",
};


async function getSecret(client, secretName) {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        return response.SecretString;
    } catch (error) {
        console.warn(`[Startup] Warning: Could not fetch secret ${secretName}: ${error.message}`);
        return null;
    }
}

async function buildDatabaseUrl(rdsSecretJson) {
    try {
        const secret = JSON.parse(rdsSecretJson);
        const endpoint = "tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com"; // Hardcoded endpoint from original script
        const port = 5432;
        const dbname = "tms_database";
        const encodedPassword = encodeURIComponent(secret.password);
        return `postgresql://${secret.username}:${encodedPassword}@${endpoint}:${port}/${dbname}?sslmode=require`;
    } catch (e) {
        console.error("[Startup] Failed to parse RDS secret JSON", e);
        throw e;
    }
}

async function main() {
    console.log(`[Startup] Initializing AWS Secrets Manager Client (${REGION})...`);
    const client = new SecretsManagerClient({ region: REGION });

    const env = { ...process.env };

    // 1. Fetch RDS Secret First (Critical)
    const rdsSecretName = "rds!db-6748f518-a7ef-42a5-a907-00fb82f38a16";
    console.log(`[Startup] Fetching RDS Secret: ${rdsSecretName}`);
    const rdsSecretValue = await getSecret(client, rdsSecretName);

    if (rdsSecretValue) {
        env.DATABASE_URL = await buildDatabaseUrl(rdsSecretValue);
        env.DATABASE_URL_MIGRATE = env.DATABASE_URL; // For migrations if needed
        console.log("[Startup] DATABASE_URL constructed successfully.");
    } else {
        console.error("[Startup] CRITICAL: Failed to load RDS Secret. DB connection will fail.");
        process.exit(1);
    }

    // 2. Fetch all other simple string secrets
    const secretPromises = Object.entries(SECRETS_MAPPING).map(async ([secretName, envKey]) => {
        if (secretName === rdsSecretName) return; // Skip RDS, already handled

        const value = await getSecret(client, secretName);
        if (value) {
            env[envKey] = value;
            console.log(`[Startup] Loaded ${envKey}`);

            // Special handling: if we just loaded NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            // We also want to expose it as NEXT_PUBLIC_GOOGLE_MAPS_PUBLIC_API_KEY for our new EnvInit
            if (envKey === 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') {
                env['NEXT_PUBLIC_GOOGLE_MAPS_PUBLIC_API_KEY'] = value;
            }
        }
    });

    await Promise.all(secretPromises);

    // 3. Set standard NextAuth/Next variables
    env.AUTH_TRUST_HOST = "true";
    console.log("[Startup] Set AUTH_TRUST_HOST=true");

    // 4. Start Next.js (Standalone Mode)
    console.log("[Startup] Starting Next.js (Standalone Mode)...");

    // Check if standalone server exists
    const fs = require('fs');
    const path = require('path');
    const standalonePath = path.join(process.cwd(), '.next', 'standalone', 'server.js');

    let cmd = 'node';
    let args = [standalonePath];

    if (!fs.existsSync(standalonePath)) {
        console.warn("[Startup] Standalone server.js not found. Falling back to 'npm start'...");
        cmd = 'npm';
        args = ['start', '--', '-p', '3001'];
    }

    const nextStart = spawn(cmd, args, {
        stdio: "inherit",
        env: {
            ...env,
            PORT: "3001",
            HOSTNAME: "0.0.0.0",
            NODE_OPTIONS: "--openssl-legacy-provider"
        },
    });

    nextStart.on("close", (code) => {
        console.log(`[Startup] Next.js process exited with code ${code}`);
        process.exit(code);
    });
}

main().catch((err) => {
    console.error("[Startup] Fatal Error:", err);
    process.exit(1);
});
