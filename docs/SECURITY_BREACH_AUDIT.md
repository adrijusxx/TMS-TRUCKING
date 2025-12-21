# 🚨 CRITICAL SECURITY BREACH AUDIT

**Date:** 2025-12-20  
**Incident:** Google Cloud VM suspended for cryptocurrency mining  
**VM Name:** telegram-userbot-vm (us-central1-c)  
**Timeframe:** 2025-12-20 13:16 - 13:37 (Pacific Time)

---

## 🔴 CRITICAL FINDINGS

### 1. Database Credentials Exposed in Repository

**SEVERITY: CRITICAL**

Database credentials have been **hardcoded and committed** to the repository in multiple files:

#### Exposed Credentials:
- **Database:** Neon PostgreSQL
- **Username:** `neondb_owner`
- **Password:** `npg_b4YTB8ruqRif` ⚠️ **EXPOSED**
- **Hosts:**
  - `ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech` (pooler)
  - `ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech` (direct)
  - `ep-gentle-waterfall-ah0lalud.c-3.us-east-1.aws.neon.tech` (direct)

#### Files Containing Exposed Credentials:

1. **`docs/ADD_DATABASE_URL_MIGRATE.md`** (Lines 32, 35, 65)
2. **`docs/archive/FIX_MISSING_DATABASE_URL.md`** (Lines 33, 36, 79)
3. **`docs/archive/FIX_NEON_DIRECT_CONNECTION.md`** (Lines 61, 64, 91)
4. **`docs/archive/FIX_LOCAL_DEV_NEXTAUTH_ERROR.md`** (Line 22)
5. **`docs/archive/LOCAL_TESTING_WITH_BASEPATH.md`** (Line 13)
6. **`docs/archive/FIX_NEON_DATABASE_CONNECTION.md`** (Lines 27, 30, 40)
7. **`scripts/setup-database-urls.sh`** (Lines 10, 13, 14)
8. **`scripts/test-direct-connection.sh`** (Lines 17, 33)

### 2. Previous Secret Leaks in Git History

Git history shows a commit that removed `test.txt` with secrets:
- **Commit:** `21de0d588277d9cadc57e1b972efef2eaf195c7f`
- **Message:** "Remove test.txt with secrets and update .gitignore"
- **Date:** 2025-12-10

This indicates **multiple instances** of credential exposure.

---

## 🔍 HOW THE ATTACK LIKELY OCCURRED

### Attack Vector 1: Repository Access
1. Attacker accessed repository (public or compromised private repo)
2. Found hardcoded database credentials in documentation
3. Used credentials to connect to database
4. Extracted additional secrets or accessed VM through database

### Attack Vector 2: Database Compromise
1. Attacker used exposed database credentials
2. Found VM connection details, SSH keys, or API keys in database
3. Gained access to VM (`telegram-userbot-vm`)
4. Installed cryptocurrency mining software

### Attack Vector 3: Environment Variable Exposure
1. If `.env` files were committed or exposed
2. All credentials would be available to attacker

---

## ⚠️ IMMEDIATE ACTIONS REQUIRED

### STEP 1: Rotate Database Credentials (URGENT - DO IMMEDIATELY)

1. **Log into Neon Console:** https://console.neon.tech
2. **Navigate to:** Your project → Settings → Connection Details
3. **Reset Database Password:**
   - Generate new password
   - Update all `.env` files on VM and local machines
   - **Do NOT commit the new password to git**

4. **Update Connection Strings:**
   ```bash
   # On VM: Update .env file
   nano /home/telegram-userbot-vm/TMS-TRUCKING/.env
   
   # Replace DATABASE_URL and DATABASE_URL_MIGRATE with new credentials
   # Restart application after update
   pm2 restart tms
   ```

### STEP 2: Remove Exposed Credentials from Repository

**DO NOT** just delete the files - they may be referenced. Instead, replace credentials with placeholders:

```bash
# Replace all instances of the exposed password with placeholders
find . -type f \( -name "*.md" -o -name "*.sh" \) -exec sed -i 's/npg_b4YTB8ruqRif/[REDACTED_PASSWORD]/g' {} \;

# Replace full connection strings with placeholders
find . -type f \( -name "*.md" -o -name "*.sh" \) -exec sed -i 's/postgresql:\/\/neondb_owner:.*@ep-gentle-waterfall/postgresql:\/\/neondb_owner:[REDACTED_PASSWORD]@ep-gentle-waterfall/g' {} \;
```

### STEP 3: Audit All Environment Variables

Check for other exposed credentials:
- API keys (Samsara, Google Maps, DeepSeek, QuickBooks)
- NEXTAUTH_SECRET
- SSH keys
- Service account credentials

### STEP 4: Check Database for Additional Compromises

1. **Audit database access logs** in Neon console
2. **Check for:**
   - Unauthorized connections
   - Unusual queries
   - New database users
   - Modified data

3. **Review Integration table:**
   ```sql
   SELECT * FROM "Integration" WHERE "provider" IN ('SAMSARA', 'QUICKBOOKS');
   -- Check if API keys were accessed/modified
   ```

### STEP 5: Secure VM Access

1. **Change SSH keys** on VM
2. **Review SSH access logs:**
   ```bash
   sudo tail -n 1000 /var/log/auth.log | grep ssh
   ```

3. **Check for unauthorized processes:**
   ```bash
   ps aux | grep -E '(miner|crypto|xmrig|cpuminer)'
   ```

4. **Review cron jobs:**
   ```bash
   crontab -l
   sudo crontab -l
   ```

5. **Check for unauthorized users:**
   ```bash
   cat /etc/passwd
   ```

6. **Review system logs:**
   ```bash
   sudo journalctl -u tms --since "2025-12-20 13:00" --until "2025-12-20 14:00"
   ```

---

## 🔐 SECURITY HARDENING CHECKLIST

### Immediate (Do Now)
- [ ] Rotate database password in Neon
- [ ] Update all `.env` files with new password
- [ ] Remove exposed credentials from repository
- [ ] Commit removal with message: "Security: Remove exposed credentials"
- [ ] Force push if repository is private (if public, the damage is done)
- [ ] Review database access logs
- [ ] Audit VM for unauthorized access
- [ ] Review all API keys and rotate if necessary

### Short-term (Within 24 hours)
- [ ] Implement credential scanning in CI/CD
- [ ] Add pre-commit hooks to prevent credential commits
- [ ] Review all documentation for hardcoded secrets
- [ ] Enable database connection logging
- [ ] Set up database access alerts
- [ ] Review and rotate all API keys
- [ ] Update .gitignore to be more comprehensive

### Long-term (Within 1 week)
- [ ] Implement secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Set up automated security scanning
- [ ] Review and harden VM security (firewall, SSH keys, etc.)
- [ ] Implement database connection encryption verification
- [ ] Set up monitoring and alerting for suspicious activity
- [ ] Conduct full security audit of codebase
- [ ] Document security best practices

---

## 📋 FILES TO UPDATE

### Remove Credentials From:

1. `docs/ADD_DATABASE_URL_MIGRATE.md`
2. `docs/archive/FIX_MISSING_DATABASE_URL.md`
3. `docs/archive/FIX_NEON_DIRECT_CONNECTION.md`
4. `docs/archive/FIX_LOCAL_DEV_NEXTAUTH_ERROR.md`
5. `docs/archive/LOCAL_TESTING_WITH_BASEPATH.md`
6. `docs/archive/FIX_NEON_DATABASE_CONNECTION.md`
7. `scripts/setup-database-urls.sh`
8. `scripts/test-direct-connection.sh`

### Update .gitignore

Ensure these patterns are included:
```
.env
.env.local
.env.*.local
*.pem
*.key
*secret*
*password*
*credential*
```

---

## 🛡️ PREVENTION RULES

### NEVER Commit:
- ✅ Database connection strings with passwords
- ✅ API keys or secrets
- ✅ SSH private keys
- ✅ `.env` files
- ✅ Configuration files with real credentials
- ✅ Test files with real credentials

### ALWAYS Use:
- ✅ Environment variables for secrets
- ✅ Placeholders in documentation (`[YOUR_DATABASE_PASSWORD]`)
- ✅ Secrets management services for production
- ✅ Different credentials for dev/staging/production

### BEFORE Committing:
- ✅ Run `git diff` to review changes
- ✅ Search for common secret patterns: `password`, `secret`, `key`, `token`
- ✅ Use pre-commit hooks to scan for secrets
- ✅ Review documentation for hardcoded values

---

## 🔗 ADDITIONAL RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Neon Security Documentation](https://neon.tech/docs/security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 📝 NOTES

- The VM name "telegram-userbot-vm" suggests this may be shared with another project
- Consider isolating this TMS project on a separate VM
- Review access logs for the time period: 2025-12-20 13:16 - 13:37 PT
- Google Cloud automatically suspended the VM when mining activity was detected
- This is a **serious breach** - treat all credentials as compromised

---

**LAST UPDATED:** 2025-12-20  
**STATUS:** 🔴 CRITICAL - IMMEDIATE ACTION REQUIRED

