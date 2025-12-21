# Troubleshooting 502 Bad Gateway Error

## What 502 Bad Gateway Means

502 Bad Gateway = **nginx can't connect to your TMS application** (localhost:3001)

This means:
- ✅ Nginx is running (otherwise you'd get "connection refused")
- ✅ SSL certificates are working (otherwise you'd get SSL errors)
- ❌ **TMS application is NOT running or crashed**

---

## Quick Diagnosis Steps

### Step 1: Check if TMS is Running

SSH into your VM and check:

```bash
ssh adrianrepair123@130.211.211.214
# or
ssh telegram-userbot-vm@130.211.211.214

# Check if PM2 is running TMS
pm2 list

# Should show something like:
# ┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┐
# │ id  │ name     │ mode        │ status  │ restart │ uptime   │
# ├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┤
# │ 0   │ tms      │ fork        │ online  │ 0       │ 5m       │
# └─────┴──────────┴─────────────┴─────────┴─────────┴──────────┘
```

**If status is "stopped" or "errored":** That's your problem!

- [ ] Check PM2 status - is TMS running?

---

### Step 2: Check Application Logs

If TMS is not running or errored, check the logs:

```bash
# Check PM2 logs
pm2 logs tms --lines 50

# Look for:
# - Error messages
# - "EADDRINUSE" (port already in use)
# - "Missing NEXTAUTH_SECRET" 
# - Database connection errors
# - Any stack traces
```

Common errors you might see:

**Missing NEXTAUTH_SECRET:**
```
❌ NEXTAUTH_SECRET is missing! Authentication will not work.
```

**Database connection error:**
```
Error: Can't reach database server
```

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

- [ ] Check logs for errors
- [ ] Identify the specific error

---

### Step 3: Check .env File

Verify your `.env` file has all required variables:

```bash
cd ~/tms
cat .env | grep -E "DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"

# Should show:
# DATABASE_URL=postgresql://...
# NEXTAUTH_URL=https://tms.vaidera.eu
# NEXTAUTH_SECRET=...
```

**Required variables:**
- ✅ `DATABASE_URL` - Must be set with new password
- ✅ `NEXTAUTH_URL` - Should be `https://tms.vaidera.eu` (not blank!)
- ✅ `NEXTAUTH_SECRET` - Must be set (32+ characters)

**If NEXTAUTH_URL is blank or missing:** The app might crash on startup!

- [ ] DATABASE_URL is set
- [ ] NEXTAUTH_URL is set (not blank)
- [ ] NEXTAUTH_SECRET is set

---

### Step 4: Check if Port 3001 is in Use

Check if something else is using port 3001:

```bash
# Check what's using port 3001
sudo netstat -tulpn | grep 3001
# or
sudo lsof -i :3001

# If something else is using it, kill it:
# sudo kill -9 <PID>
```

- [ ] Port 3001 is free (or TMS is using it)

---

## Fixing Common Issues

### Issue 1: TMS Not Running

**If PM2 shows TMS as "stopped" or "errored":**

```bash
cd ~/tms

# Check .env file first
nano .env
# Make sure all required vars are set (see Step 3)

# Try to start manually to see errors
npm start

# If that works, stop it (Ctrl+C) and start with PM2:
pm2 start ecosystem.config.js
# or
pm2 restart tms
```

---

### Issue 2: Missing NEXTAUTH_URL

**If NEXTAUTH_URL is blank or missing:**

```bash
cd ~/tms
nano .env

# Add or update this line:
NEXTAUTH_URL="https://tms.vaidera.eu"

# Save: Ctrl+X, Y, Enter

# Restart application
pm2 restart tms --update-env

# Check if it's running now
pm2 list
pm2 logs tms --lines 20
```

---

### Issue 3: Database Connection Error

**If you see database connection errors:**

```bash
cd ~/tms

# Verify DATABASE_URL is correct
grep DATABASE_URL .env

# Test database connection
npm run db:test-connection
# or
npx prisma db pull

# If it fails, update DATABASE_URL with correct password
nano .env
# Update DATABASE_URL with new Neon password

# Restart application
pm2 restart tms --update-env
```

---

### Issue 4: Port Already in Use

**If port 3001 is already in use:**

```bash
# Find what's using the port
sudo lsof -i :3001

# Kill the process (replace <PID> with actual PID)
sudo kill -9 <PID>

# Or stop all PM2 processes and restart
pm2 delete all
cd ~/tms
pm2 start ecosystem.config.js
```

---

## Complete Fix Checklist

Follow these steps in order:

1. **SSH into VM:**
   ```bash
   ssh adrianrepair123@130.211.211.214
   ```

2. **Check PM2 status:**
   ```bash
   pm2 list
   ```

3. **Check logs if not running:**
   ```bash
   pm2 logs tms --lines 50
   ```

4. **Verify .env file:**
   ```bash
   cd ~/tms
   cat .env | grep -E "DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"
   ```

5. **Fix .env if needed:**
   ```bash
   nano .env
   # Make sure these are set:
   # DATABASE_URL="postgresql://neondb_owner:NEW_PASSWORD@..."
   # NEXTAUTH_URL="https://tms.vaidera.eu"
   # NEXTAUTH_SECRET="V92FqABTUDD7BJdUKDaPCWAuY7ATVIxKc2/nCus+eQA=" (or your generated one)
   ```

6. **Restart application:**
   ```bash
   pm2 restart tms --update-env
   # or if not in PM2:
   pm2 start ecosystem.config.js
   ```

7. **Verify it's running:**
   ```bash
   pm2 list
   pm2 logs tms --lines 20
   ```

8. **Test local connection:**
   ```bash
   curl -I http://localhost:3001
   # Should return HTTP 200 or 301/302 redirect
   ```

9. **Test through nginx:**
   ```bash
   curl -I https://tms.vaidera.eu
   curl -I https://alogix.info
   # Should return HTTP 200 or 301/302 redirect (not 502)
   ```

---

## SSL Certificate Note

SSL certificates are **NOT the problem** if you're getting 502 errors. SSL errors would show as:
- "SSL connection error"
- "Certificate invalid"
- Browser warning pages

502 Bad Gateway specifically means nginx → application connection failed.

However, make sure SSL certificates are still valid:

```bash
# Check certificate expiry
sudo certbot certificates

# Renew if needed (usually auto-renewed, but check)
sudo certbot renew --dry-run
```

---

## Quick Diagnostic Script

Run this to check everything at once:

```bash
cd ~/tms

echo "=== PM2 Status ==="
pm2 list

echo ""
echo "=== Port 3001 Status ==="
sudo netstat -tulpn | grep 3001

echo ""
echo "=== Environment Variables ==="
grep -E "DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET" .env

echo ""
echo "=== Recent Logs ==="
pm2 logs tms --lines 20 --nostream

echo ""
echo "=== Local Connection Test ==="
curl -I http://localhost:3001 2>&1 | head -5
```

---

## Expected Outcome

After fixing, you should see:

✅ `pm2 list` shows TMS as "online"  
✅ `pm2 logs tms` shows no errors  
✅ `curl http://localhost:3001` returns HTTP 200/301/302  
✅ `curl https://tms.vaidera.eu` returns HTTP 200 (not 502)  
✅ `curl https://alogix.info` returns HTTP 200 (not 502)  

---

**The most likely cause:** TMS application is not running due to missing or incorrect environment variables (especially NEXTAUTH_URL).

---

**Last Updated:** 2025-12-20

