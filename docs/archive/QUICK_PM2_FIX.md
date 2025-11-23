# Quick PM2 Fix Commands

## Check PM2 Status
```bash
pm2 list
```

## If process doesn't exist, start it:

### Option 1: Using PM2 directly (Simple)
```bash
cd ~/TMS-TRUCKING
pm2 start npm --name "tms" -- start -- -p 3001
pm2 save
```

### Option 2: Using ecosystem.config.js
First, update the path in `ecosystem.config.js`:
```bash
cd ~/TMS-TRUCKING
nano ecosystem.config.js
# Change: cwd: '/home/your-username/TMS-TRUCKING'
# To: cwd: '/home/adrianrepair123/TMS-TRUCKING'
```

Then start:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Restart existing process
```bash
pm2 restart tms
```

## Update environment variables and restart
```bash
# Make sure .env file has NEXT_PUBLIC_BASE_PATH=/tms
cd ~/TMS-TRUCKING
pm2 restart tms --update-env
```

## View logs
```bash
pm2 logs tms
```

## Check if app is running
```bash
curl http://localhost:3001
```

