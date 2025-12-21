# Nginx Configuration Verification for Domain-Based Setup

## Current Setup Analysis

Your nginx configuration uses **domain names** (`tms.vaidera.eu`, `alogix.info`) instead of IP addresses, which is the correct approach. This means:

✅ **Good news:** Your nginx config should continue working once DNS propagates to the new IP

✅ **Minimal changes needed:** The configuration is already correct

---

## What You Need to Check

### 1. DNS Records

Make sure your DNS records point to the new IP:

- `tms.vaidera.eu` → `130.211.211.214`
- `alogix.info` → `130.211.211.214`
- `crm.vaidera.eu` → `130.211.211.214` (if different)

**Check DNS:**
```bash
# From your local machine
nslookup tms.vaidera.eu
nslookup alogix.info
# Should show: 130.211.211.214
```

- [ ] DNS records updated to point to new IP
- [ ] DNS propagation verified (may take a few minutes to hours)

### 2. NEXTAUTH_URL in .env

Since you're using domain names, your `NEXTAUTH_URL` should use the domain, not the IP:

**Current (probably using IP):**
```env
NEXTAUTH_URL="http://130.211.211.214/tms"
```

**Should be (using domain with HTTPS):**
```env
NEXTAUTH_URL="https://tms.vaidera.eu"
```

**Or if you want to support both domains:**
```env
NEXTAUTH_URL="https://tms.vaidera.eu"
```

**Update on VM:**
```bash
cd ~/tms
nano .env

# Find NEXTAUTH_URL and update to:
NEXTAUTH_URL="https://tms.vaidera.eu"

# Save and restart
pm2 restart tms --update-env
```

- [ ] NEXTAUTH_URL updated to use domain (https://tms.vaidera.eu)
- [ ] Application restarted

### 3. Verify Nginx Config is Active

Your nginx config looks good! Just verify it's active:

```bash
# Test nginx config
sudo nginx -t

# Should show: syntax is ok, test is successful

# Reload nginx (no downtime)
sudo nginx -s reload

# Or restart if needed
sudo systemctl restart nginx
```

- [ ] Nginx config tested
- [ ] Nginx reloaded/restarted

---

## Your Current Nginx Config Review

✅ **Correct Setup:**
- Uses domain names (`tms.vaidera.eu`, `alogix.info`)
- Has SSL certificates configured
- Proper proxy settings
- Redirects HTTP to HTTPS
- Has the new IP in redirect block (already updated)

✅ **Nothing to change in nginx config** - it's already correct!

The only line that references the IP is in the redirect block:
```nginx
server_name vaidera.eu www.vaidera.eu 130.211.211.214;
```

This is correct and already has the new IP `130.211.211.214`.

---

## Summary of Changes Needed

| Item | Status | Action |
|------|--------|--------|
| Nginx config | ✅ Correct | No changes needed |
| DNS records | ⚠️ Check | Verify points to `130.211.211.214` |
| NEXTAUTH_URL | ⚠️ Update | Change to `https://tms.vaidera.eu` |
| SSL certificates | ✅ OK | Certbot manages these |

---

## Testing After Changes

1. **Test HTTPS access:**
   ```bash
   curl -I https://tms.vaidera.eu
   curl -I https://alogix.info
   ```
   Should return HTTP 200

2. **Test in browser:**
   - Open: https://tms.vaidera.eu
   - Should load TMS application
   - Login should work

3. **Check application logs:**
   ```bash
   pm2 logs tms --lines 20
   ```
   Should not show connection errors

---

## Why Domain-Based is Better

Using domain names instead of IP addresses:
- ✅ SSL certificates work properly
- ✅ Survives IP changes (just update DNS)
- ✅ More professional
- ✅ Better for SEO
- ✅ Easier to remember

Your setup is already using this best practice! 🎉

---

**Last Updated:** 2025-12-20  
**VM IP:** 130.211.211.214  
**Domain:** tms.vaidera.eu, alogix.info

