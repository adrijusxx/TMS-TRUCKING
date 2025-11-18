// PM2 Ecosystem Configuration for TMS
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'tms',
      script: 'npm',
      args: 'start -- -p 3001',
      cwd: process.cwd(), // Use current directory
      instances: 1,
      exec_mode: 'fork',
      env_file: '.env', // Load environment variables from .env file
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // These will be loaded from .env file, but we can also set defaults here
        NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '/tms',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://34.121.40.233/tms',
        // Spread all other env vars from .env
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

