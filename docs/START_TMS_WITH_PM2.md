# How to Start TMS with PM2

## Quick Start

```bash
cd ~/tms
pm2 start ecosystem.config.js
pm2 save
```

## Prerequisites

Before starting, make sure:

1. **Application is built:**
   ```bash
   ls -la .next
   # If .next directory doesn't exist:
   npm run build
   ```

2. **.env file is configured:**
   ```bash
   cat .env | grep -E "DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"
   ```

## Complete Setup Steps

### Step 1: Verify Directory and Build

```bash
cd ~/tms
pwd
# Should show: /home/adrianrepair123/tms

# Check if built
ls -la .next
# If .next doesn't exist or is empty:
npm run build
```

### Step 2: Check/Update .env File

```bash
nano .env
```

Required variables:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="https://tms.vaidera.eu"
NEXTAUTH_SECRET="your-secret-here"
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 3: Start with PM2

**Option A: Using ecosystem.config.js (Recommended)**
```bash
pm2 start ecosystem.config.js
pm2 save
```

**Option B: Direct command**
```bash
pm2 start npm --name "tms" -- start -- -p 3001
pm2 save
```

### Step 4: Verify It's Running

```bash
# Check PM2 status
pm2 list

# Should show:
# ┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┐
# │ id  │ name     │ mode        │ status  │ restart │ uptime   │
# ├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┤
# │ 0   │ tms      │ fork        │ online  │ 0       │ 5m       │
# └─────┴──────────┴─────────────┴─────────┴─────────┴──────────┘

# Check logs
pm2 logs tms --lines 20
```

### Step 5: Test Application

```bash
# Test local connection
curl -I http://localhost:3001
# Should return HTTP 200 or 301/302

# Test through nginx
curl -I https://tms.vaidera.eu
curl -I https://alogix.info
# Should return HTTP 200 (not 502)
```

## Common Issues

### Issue: "Process or Namespace tms not found"

**Solution:** Start it using one of the methods above.

### Issue: "Script not found"

**Solution:** Make sure you're in the correct directory (`~/tms`) and the app is built.

### Issue: App starts then crashes

**Check logs:**
```bash
pm2 logs tms --lines 50
```

Common causes:
- Missing or incorrect `DATABASE_URL`
- Missing or incorrect `NEXTAUTH_URL`
- Missing or incorrect `NEXTAUTH_SECRET`
- Port 3001 already in use

### Issue: Port 3001 already in use

```bash
# Check what's using the port
sudo lsof -i :3001

# Kill the process (replace <PID> with actual PID)
sudo kill -9 <PID>

# Or restart PM2
pm2 restart tms
```

## PM2 Management Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs tms

# Restart
pm2 restart tms

# Stop
pm2 stop tms

# Delete
pm2 delete tms

# Monitor
pm2 monit

# Save current process list (auto-start on reboot)
pm2 save
```

## Auto-Start on Reboot

PM2 processes started with `pm2 save` will automatically start on VM reboot.

To verify:
```bash
# Check if startup script is configured
pm2 startup
# Follow the instructions if not configured
```

---

**Last Updated:** 2025-12-20

