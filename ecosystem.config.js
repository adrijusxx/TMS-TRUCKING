// PM2 Ecosystem Configuration for TMS
const fs = require('fs');
const path = require('path');

// Load .env file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          let value = valueParts.join('=');
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value.trim();
        }
      }
    });
  }
  
  return env;
}

const envVars = loadEnvFile();

module.exports = {
  apps: [
    {
      name: 'tms',
      script: 'bash',
      args: 'scripts/start-app-with-secrets.sh',
      cwd: process.cwd(), // Use current directory
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // AWS Region - required for Secrets Manager
        // Note: Your RDS is in us-east-1, so use that region (force us-east-1)
        AWS_REGION: 'us-east-1',
        // Load from .env file
        // For subdomain deployment, basePath should be empty (not '/tms')
        NEXT_PUBLIC_BASE_PATH: envVars.NEXT_PUBLIC_BASE_PATH || '',
        NEXTAUTH_URL: envVars.NEXTAUTH_URL || 'https://tms.vaidera.eu',
        // RDS Secret ARN (optional - if using RDS-managed secret for automatic password rotation)
        RDS_SECRET_ARN: envVars.RDS_SECRET_ARN || process.env.RDS_SECRET_ARN,
        // Spread all other env vars from .env (but don't override AWS_REGION if set above)
        ...envVars,
        // Also include process.env for any system variables
        ...process.env,
      },
      error_file: './logs/tms-error.log',
      out_file: './logs/tms-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
    },
  ],
};

