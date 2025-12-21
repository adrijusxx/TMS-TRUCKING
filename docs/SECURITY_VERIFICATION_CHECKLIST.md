# ✅ Security Verification Checklist

**Status:** Database password rotated ✅ | Neon API key rotated ✅

---

## 🔐 STEP 1: Update Environment Files (CRITICAL)

### On Your Local Machine:

1. **Update `.env.local` (or `.env`):**
   ```bash
   # Update DATABASE_URL with NEW password
   DATABASE_URL="postgresql://neondb_owner:[NEW_PASSWORD]@ep-gentle-waterfall-ah0lalud-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
   
   # Update DATABASE_URL_MIGRATE with NEW password
   DATABASE_URL_MIGRATE="postgresql://neondb_owner:[NEW_PASSWORD]@ep-gentle-waterfall-ah0lalud.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

### On Your VM:

2. **SSH into VM and update `.env`:**
   ```bash
   ssh telegram-userbot-vm@34.121.40.233
   cd /home/telegram-userbot-vm/TMS-TRUCKING
   nano .env
   
   # Update both DATABASE_URL and DATABASE_URL_MIGRATE with NEW password
   # Save: Ctrl+X, Y, Enter
   
   # Restart application
   pm2 restart tms --update-env
   
   # Verify it's running
   pm2 logs tms --lines 20
   ```

- [ ] Local `.env.local` updated with new database password
- [ ] VM `.env` updated with new database password
- [ ] VM application restarted and working

---

## 🔍 STEP 2: Check Database for API Keys (IMPORTANT)

Since the database was exposed, check if any API keys are stored there:

### Connect to Database and Check Integration Table:

```sql
-- Check what API keys are stored in the database
SELECT 
  "provider",
  "companyId",
  "isActive",
  LENGTH("apiKey") as key_length,
  "updatedAt",
  "createdAt"
FROM "Integration"
ORDER BY "updatedAt" DESC;
```

### If You Find API Keys in Database:

**For each integration found, you need to:**

1. **Samsara** (if found):
   - [ ] Go to Samsara Dashboard → Settings → API Tokens
   - [ ] Revoke old token
   - [ ] Create new token
   - [ ] Update in database:
     ```sql
     UPDATE "Integration"
     SET "apiKey" = 'NEW_API_KEY_HERE',
         "updatedAt" = NOW()
     WHERE "provider" = 'SAMSARA' AND "companyId" = 'YOUR_COMPANY_ID';
     ```

2. **QuickBooks** (if found):
   - [ ] Go to QuickBooks Developer Dashboard
   - [ ] Regenerate Client ID and Secret
   - [ ] Update in database or `.env`

3. **Other integrations** (if any):
   - [ ] Rotate API keys
   - [ ] Update in database

- [ ] Checked Integration table for stored API keys
- [ ] Rotated any API keys found in database
- [ ] Updated database with new API keys

---

## 🔑 STEP 3: Check Environment Variables for Other API Keys

Even if API keys aren't in the database, check your `.env` files for these keys and rotate them if the database was compromised:

### Check for These Keys in `.env` Files:

```bash
# On local machine
grep -E "(API_KEY|SECRET|CLIENT_ID|CLIENT_SECRET)" .env.local .env 2>/dev/null

# On VM (after SSH)
grep -E "(API_KEY|SECRET|CLIENT_ID|CLIENT_SECRET)" .env
```

### Keys to Check:

1. **Samsara API Key:**
   - Variable: `SAMSARA_API_KEY`
   - [ ] Checked if set in `.env`
   - [ ] Rotated if found (Samsara Dashboard → API Tokens)

2. **Samsara Webhook Secret:**
   - Variable: `SAMSARA_WEBHOOK_SECRET`
   - [ ] Checked if set
   - [ ] Rotated if found

3. **Google Maps API Key:**
   - Variables: `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - [ ] Checked if set
   - [ ] Rotated if found (Google Cloud Console → APIs & Services → Credentials)
   - ⚠️ **Note:** `NEXT_PUBLIC_*` keys are exposed to browser - rotate if compromised

4. **DeepSeek API Key:**
   - Variable: `DEEPSEEK_API_KEY`
   - [ ] Checked if set
   - [ ] Rotated if found (DeepSeek Dashboard)

5. **QuickBooks Credentials:**
   - Variables: `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`
   - [ ] Checked if set
   - [ ] Rotated if found

6. **NextAuth Secret:**
   - Variable: `NEXTAUTH_SECRET`
   - [ ] Checked if set
   - [ ] ⚠️ **Rotate this!** If database was compromised, session tokens could be forged
   - Generate new: `openssl rand -base64 32`

7. **Cron Secret:**
   - Variable: `CRON_SECRET`
   - [ ] Checked if set
   - [ ] Rotated if found

- [ ] All environment variables checked
- [ ] All API keys rotated
- [ ] All secrets rotated

---

## 🔄 STEP 4: Update All Locations with New Credentials

### Priority Order:

1. **VM `.env` file** (highest priority - production)
   - [ ] Updated with new database password
   - [ ] Updated with rotated API keys (if any)
   - [ ] Application restarted

2. **Local `.env.local` file** (development)
   - [ ] Updated with new database password
   - [ ] Updated with rotated API keys (if any)

3. **Database Integration table** (if using database storage)
   - [ ] Updated with rotated API keys

---

## 🧪 STEP 5: Verify Everything Works

### Test Database Connection:

```bash
# On VM
cd /home/telegram-userbot-vm/TMS-TRUCKING
npm run db:test-connection

# Should show: ✅ Connection successful
```

### Test Application:

1. **Access TMS:**
   - [ ] Open: http://34.121.40.233/tms
   - [ ] Login works
   - [ ] Dashboard loads

2. **Test Integrations (if configured):**
   - [ ] Samsara Live Map loads (if using Samsara)
   - [ ] Google Maps works (if using Google Maps)
   - [ ] AI features work (if using DeepSeek)

3. **Check Application Logs:**
   ```bash
   pm2 logs tms --lines 50
   # Look for connection errors or API key errors
   ```

- [ ] Database connection verified
- [ ] Application accessible and working
- [ ] No errors in logs
- [ ] Integrations working (if configured)

---

## 📝 STEP 6: Commit Credential Removal to Repository

Make sure the exposed credentials are removed from the codebase:

```bash
# Review what will be committed
git status
git diff

# Commit the credential removal
git add .
git commit -m "Security: Remove exposed database credentials from documentation"

# Push to repository
git push
```

- [ ] Reviewed changes
- [ ] Committed credential removal
- [ ] Pushed to repository

---

## 🔍 STEP 7: Additional Security Checks

### Check NEXTAUTH_SECRET Rotation:

If `NEXTAUTH_SECRET` was in the database or exposed, **all users will need to log out and log back in** after rotation:

1. **Generate new secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update in `.env` files**

3. **Restart application**

4. **⚠️ Users will be logged out** - this is expected and secure

- [ ] NEXTAUTH_SECRET rotated (if needed)
- [ ] Users notified they may need to log in again

### Verify No Other Secrets Exposed:

```bash
# Search for hardcoded secrets in codebase (excluding node_modules, .git, .next)
grep -r -i "password\|secret\|api_key\|apikey" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . | grep -v "YOUR_DATABASE_PASSWORD\|placeholder\|example"
```

- [ ] Searched for other hardcoded secrets
- [ ] No additional secrets found

---

## ✅ FINAL VERIFICATION

Before proceeding, ensure:

- [ ] ✅ Neon database password rotated
- [ ] ✅ Neon API key rotated  
- [ ] ✅ All `.env` files updated with new password
- [ ] ✅ VM application restarted and working
- [ ] ✅ Database Integration table checked for API keys
- [ ] ✅ All API keys rotated (Samsara, Google Maps, DeepSeek, QuickBooks if used)
- [ ] ✅ NEXTAUTH_SECRET rotated (if exposed)
- [ ] ✅ All credentials removed from repository
- [ ] ✅ Changes committed and pushed
- [ ] ✅ Application tested and working
- [ ] ✅ No errors in logs

---

## 🚨 IF SOMETHING DOESN'T WORK

### Database Connection Fails:
- Verify password is correct in `.env`
- Check Neon console for connection issues
- Verify connection string format

### API Keys Not Working:
- Verify keys are updated in correct location (`.env` vs database)
- Check API key permissions/scopes
- Review application logs for specific errors

### Application Won't Start:
- Check `pm2 logs tms` for errors
- Verify all required environment variables are set
- Check database connection first

---

**Last Updated:** 2025-12-20  
**Next Steps:** Complete this checklist, then proceed with VM security audit

