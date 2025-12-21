# NextAuth Configuration for Multiple Domains

## Understanding NEXTAUTH_URL

**NEXTAUTH_URL** is the **primary callback URL** that NextAuth uses for:
- Generating callback URLs after authentication
- Creating session cookies (domain-specific)
- Redirecting after login/logout

Even though you have **two domains** (`tms.vaidera.eu` and `alogix.info`), you set `NEXTAUTH_URL` to **one primary domain**.

---

## Why Use One Domain for NEXTAUTH_URL?

1. **Session Cookies are Domain-Specific**: Cookies set by NextAuth are tied to the domain in `NEXTAUTH_URL`
2. **Callback URLs**: OAuth providers (if you use them) need one callback URL
3. **Primary Domain**: Choose one domain as your "primary" - users can access from either, but sessions work best with one

---

## How to Configure for Multiple Domains

### Option 1: Use Primary Domain (Recommended)

Set `NEXTAUTH_URL` to your **primary domain**:

```env
# Use the primary domain you want sessions to work on
NEXTAUTH_URL="https://tms.vaidera.eu"

# OR if alogix.info is your primary:
# NEXTAUTH_URL="https://alogix.info"
```

**How it works:**
- Users can access from either domain
- Sessions/cookies will work best on the domain in `NEXTAUTH_URL`
- The other domain will still work, but users might need to log in separately

### Option 2: Configure NextAuth to Accept Both Domains

You can configure NextAuth to accept requests from multiple domains by checking the host header. However, this requires code changes.

---

## Current Issue: 404 on Both Domains

The 404 errors suggest the **app isn't running** or **not built correctly**. Let's fix that first:

### Step 1: Check if App is Running

```bash
ssh adrianrepair123@130.211.211.214
cd ~/tms

# Check PM2 status
pm2 list

# Check logs
pm2 logs tms --lines 50
```

### Step 2: Check .env Configuration

```bash
cat .env | grep -E "NEXTAUTH_URL|NEXT_PUBLIC_BASE_PATH|DATABASE_URL"
```

Should show:
```env
NEXT_PUBLIC_BASE_PATH=
NEXTAUTH_URL="https://tms.vaidera.eu"  # or https://alogix.info (your choice)
DATABASE_URL="postgresql://..."
```

### Step 3: Rebuild if Needed

```bash
# Clean and rebuild
rm -rf .next
npm run build

# Restart
pm2 restart tms --update-env
```

### Step 4: Test Local Connection

```bash
# Test if app is responding locally
curl -I http://localhost:3001

# Should return HTTP 200 or 301/302
# If 502 or connection refused, app isn't running
```

---

## Recommendation: Use tms.vaidera.eu as Primary

Since `tms.vaidera.eu` is more descriptive, use it as your primary:

```env
NEXTAUTH_URL="https://tms.vaidera.eu"
NEXT_PUBLIC_BASE_PATH=
```

**Result:**
- ✅ `tms.vaidera.eu` - Full functionality, sessions work
- ✅ `alogix.info` - Works, but users need to log in separately (cookies are domain-specific)

---

## If You Want Sessions to Work on Both Domains

This requires more complex setup:

1. **Set cookie domain to parent domain** (if they share a parent):
   - Not possible here (`.vaidera.eu` vs `.info`)

2. **Use a session storage solution** (database/Redis) instead of cookies:
   - NextAuth supports database sessions
   - Cookies still domain-specific, but session data shared

3. **Accept both domains in NextAuth config**:
   - Modify `lib/auth.ts` to check host header
   - More complex, but possible

For most use cases, **Option 1 (primary domain)** is sufficient.

---

## Quick Fix Commands

```bash
cd ~/tms

# 1. Check if running
pm2 list

# 2. Check .env
cat .env | grep NEXTAUTH_URL

# 3. Update .env (use tms.vaidera.eu as primary)
nano .env
# Set: NEXTAUTH_URL="https://tms.vaidera.eu"
# Set: NEXT_PUBLIC_BASE_PATH=

# 4. Clean rebuild
rm -rf .next
npm run build

# 5. Restart
pm2 restart tms --update-env

# 6. Test
curl -I http://localhost:3001
```

---

**The 404 errors are likely because the app isn't running, not because of the NEXTAUTH_URL domain choice.**

---

**Last Updated:** 2025-12-20

