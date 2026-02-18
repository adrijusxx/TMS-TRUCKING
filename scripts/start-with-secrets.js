const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { spawn } = require("child_process");
const fs = require('fs');
const path = require('path');
const os = require('os');

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

/**
 * Extract and normalize a PEM private key from various storage formats.
 * Handles: JSON key/value secrets (AWS Secrets Manager), spaces instead of newlines,
 * escaped newlines, surrounding quotes. Always outputs a clean PKCS#8 PEM.
 */
function normalizePemKey(raw) {
    let value = raw;

    // 1. If stored as JSON key/value (AWS Secrets Manager "Key/value" format),
    //    extract the first string value from the JSON object
    if (value.startsWith('{')) {
        try {
            const parsed = JSON.parse(value);
            const strVal = Object.values(parsed).find(v => typeof v === 'string');
            if (strVal) value = strVal;
        } catch {}
    }

    // 2. Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }

    // 3. Replace escaped newlines with real newlines, strip carriage returns
    value = value.replace(/\\n/g, '\n').replace(/\r/g, '');

    // 4. Extract raw base64 from PEM (handles spaces, newlines, or mixed whitespace)
    //    Then reconstruct a clean PEM with proper 64-char line breaks
    const base64 = value
        .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
        .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
        .replace(/\s+/g, ''); // strip ALL whitespace (spaces, newlines, tabs)

    const chunked = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
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

    // 2b. Set GOOGLE_APPLICATION_CREDENTIALS for Google Sheets auth
    //     Prefer a pre-deployed SA JSON file on disk (avoids Secrets Manager PEM encoding issues)
    const googleSAFilePath = '/opt/tms/google-sa.json';

    if (fs.existsSync(googleSAFilePath)) {
        env['GOOGLE_APPLICATION_CREDENTIALS'] = googleSAFilePath;
        console.log(`[Startup] Google SA credentials file found at ${googleSAFilePath}`);
    } else {
        // Fallback: construct temp file from Secrets Manager values
        const googleEmail = env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
        const googleKey = env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'];

        if (googleEmail && googleKey) {
            try {
                const normalizedKey = normalizePemKey(googleKey);

                const credentials = {
                    type: 'service_account',
                    client_email: googleEmail,
                    private_key: normalizedKey,
                };

                const credPath = path.join(os.tmpdir(), 'google-sa-credentials.json');
                fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2), {
                    encoding: 'utf8',
                    mode: 0o600,
                });

                env['GOOGLE_APPLICATION_CREDENTIALS'] = credPath;
                console.log(`[Startup] Google SA credentials file written to ${credPath}`);
            } catch (credError) {
                console.warn('[Startup] Warning: Could not write Google credentials file:', credError.message);
            }
        }
    }

    // 3. Set standard NextAuth/Next variables
    env.AUTH_TRUST_HOST = "true";
    console.log("[Startup] Set AUTH_TRUST_HOST=true");

    // 4. Start Next.js (Standalone Mode)
    console.log("[Startup] Starting Next.js (Standalone Mode)...");

    // Check if standalone server exists
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
            HOSTNAME: "0.0.0.0"
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
