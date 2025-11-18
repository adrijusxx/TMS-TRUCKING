// PM2 Ecosystem Configuration for TMS
module.exports = {
  apps: [
    {
      name: 'tms',
      script: 'npm',
      args: 'start -- -p 3001',
      cwd: '/home/your-username/TMS-TRUCKING', // Update with your actual path
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
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

