# 🚨 IMMEDIATE SECURITY ACTION PLAN

**BREACH DETECTED:** 2025-12-20  
**STATUS:** 🔴 CRITICAL - ACT NOW

---

## ⏰ TIME-SENSITIVE ACTIONS (Do Within 1 Hour)

### 1. Rotate Database Password (5 minutes)

1. **Go to Neon Console:** https://console.neon.tech
2. **Select your project** → **Settings** → **Connection Details**
3. **Click "Reset Password"** or create new database user
4. **Generate new password** (save it securely, but NOT in git)
5. **Update .env files:**

```bash
# On your local machine
nano .env.local
# Update DATABASE_URL and DATABASE_URL_MIGRATE

# On VM (SSH into it)
ssh telegram-userbot-vm@34.121.40.233
cd /home/telegram-userbot-vm/TMS-TRUCKING
nano .env
# Update DATABASE_URL and DATABASE_URL_MIGRATE
pm2 restart tms  # Restart application
```

### 2. Remove Exposed Credentials from Repository (10 minutes)

```bash
# Run the sanitization script
./scripts/security/remove-exposed-credentials.sh

# OR manually edit files and replace:
# npg_b4YTB8ruqRif → [YOUR_DATABASE_PASSWORD]
# Full connection strings → Placeholder format

# Review changes
git diff

# Commit removal
git add .
git commit -m "Security: Remove exposed database credentials"
git push
```

### 3. Check Database for Unauthorized Access (15 minutes)

1. **In Neon Console:**
   - Go to **Dashboard** → **Activity** or **Logs**
   - Check connection logs from 2025-12-20 13:00-14:00 PT
   - Look for unusual IP addresses or query patterns

2. **Check Integration table for API keys:**
```sql
SELECT 
  "provider", 
  "isActive", 
  LENGTH("apiKey") as key_length,
  "updatedAt"
FROM "Integration"
WHERE "provider" IN ('SAMSARA', 'QUICKBOOKS', 'DEEPSEEK')
ORDER BY "updatedAt" DESC;
```

3. **Check for new database users:**
```sql
SELECT usename, usesuper, usecreatedb 
FROM pg_user 
ORDER BY usecreatedb DESC;
```

### 4. Audit VM for Compromise (20 minutes)

SSH into your VM and run:

```bash
# Check for mining processes (should be none)
ps aux | grep -E '(miner|crypto|xmrig|cpuminer|ccminer)'

# Check system load (should be normal)
uptime
top

# Check recent SSH logins
sudo tail -n 100 /var/log/auth.log | grep ssh

# Check for unauthorized users
cat /etc/passwd | grep -E '(bash|sh)$'

# Check cron jobs
crontab -l
sudo crontab -l

# Check for suspicious files
find /home -name "*.sh" -type f -mtime -1 2>/dev/null
find /tmp -name "*miner*" -o -name "*crypto*" 2>/dev/null

# Check network connections
netstat -tulpn | grep -E '(ESTABLISHED|LISTEN)'

# Check disk usage (mining can fill up disk)
df -h
```

### 5. Rotate API Keys (10 minutes)

If database was compromised, rotate these API keys:

1. **Samsara API Key:**
   - Log into Samsara Dashboard
   - Go to Settings → API Tokens
   - Revoke old token, create new one
   - Update in database: `Integration` table
   - Update in `.env` if using environment variable

2. **Google Maps API Key:**
   - Google Cloud Console → APIs & Services → Credentials
   - Regenerate API key
   - Update in `.env`

3. **DeepSeek API Key:**
   - DeepSeek Dashboard → API Keys
   - Regenerate key
   - Update in `.env`

4. **QuickBooks API Credentials:**
   - QuickBooks Developer Dashboard
   - Regenerate Client ID and Secret
   - Update in `.env` or database

---

## 🔍 INVESTIGATION STEPS (Within 24 Hours)

### Check Git History for More Leaks

```bash
# Search git history for secrets
git log --all --source --full-history -S "password" --pretty=format:"%H %an %ae %ad %s" --date=short
git log --all --source --full-history -S "secret" --pretty=format:"%H %an %ae %ad %s" --date=short
git log --all --source --full-history -S "api_key" --pretty=format:"%H %an %ae %ad %s" --date=short

# Check for .env files in history
git log --all --full-history --diff-filter=A -- ".env*"

# Check what was in test.txt that was removed
git show 21de0d588277d9cadc57e1b972efef2eaf195c7f:test.txt 2>/dev/null || echo "File already purged from history"
```

### Check Repository Access

1. **If repository is public:**
   - Assume credentials are compromised
   - Rotate ALL credentials immediately
   - Consider making repository private

2. **If repository is private:**
   - Review collaborators and access logs
   - Check for unauthorized access
   - Review GitHub/GitLab security logs

### Database Forensics

1. **Check for data exfiltration:**
```sql
-- Check for recent bulk reads (if query logging enabled)
-- This would require Neon's query logging feature

-- Check Integration table modification times
SELECT 
  "provider",
  "companyId",
  "isActive",
  "createdAt",
  "updatedAt"
FROM "Integration"
ORDER BY "updatedAt" DESC
LIMIT 20;
```

2. **Check User table for unauthorized changes:**
```sql
SELECT 
  email,
  role,
  "isActive",
  "createdAt",
  "updatedAt"
FROM "User"
WHERE "updatedAt" >= '2025-12-20 13:00:00'
ORDER BY "updatedAt" DESC;
```

---

## ✅ VERIFICATION CHECKLIST

After completing immediate actions, verify:

- [ ] Database password rotated in Neon
- [ ] All `.env` files updated with new password
- [ ] Application restarted and working
- [ ] Exposed credentials removed from repository
- [ ] Changes committed and pushed
- [ ] Database logs reviewed for unauthorized access
- [ ] VM checked for mining processes (none found)
- [ ] SSH logs reviewed for unauthorized access
- [ ] All API keys rotated
- [ ] Git history scanned for additional leaks
- [ ] Repository access logs reviewed

---

## 📞 ESCALATION

If you find evidence of:
- **Data exfiltration** → Contact Neon support immediately
- **Unauthorized database modifications** → Contact Neon support + review backups
- **Active compromise on VM** → Shut down VM, restore from clean snapshot
- **Multiple credential exposures** → Assume full compromise, rotate everything

---

## 🔐 PREVENTION (Do After Immediate Actions)

1. **Set up credential scanning:**
   ```bash
   # Install gitleaks (if not already installed)
   # https://github.com/gitleaks/gitleaks
   gitleaks detect --source . --verbose
   ```

2. **Add pre-commit hook:**
   ```bash
   # Create .git/hooks/pre-commit
   # Scan for secrets before allowing commit
   ```

3. **Review all documentation:**
   - Search for hardcoded passwords, API keys, connection strings
   - Replace with placeholders
   - Add instructions to use environment variables

4. **Update deployment scripts:**
   - Never hardcode credentials
   - Always use environment variables
   - Add validation to ensure secrets are set

---

## 📋 SUMMARY

**What Happened:**
- Database credentials exposed in repository
- VM compromised and used for cryptocurrency mining
- Google Cloud suspended VM for ToS violation

**What You Must Do Now:**
1. ✅ Rotate database password (5 min)
2. ✅ Remove credentials from repo (10 min)
3. ✅ Audit database access (15 min)
4. ✅ Check VM for compromise (20 min)
5. ✅ Rotate API keys (10 min)

**Total Time:** ~60 minutes for immediate actions

**Risk Level:** 🔴 CRITICAL - Act immediately

---

**Last Updated:** 2025-12-20  
**Next Review:** After completing immediate actions

