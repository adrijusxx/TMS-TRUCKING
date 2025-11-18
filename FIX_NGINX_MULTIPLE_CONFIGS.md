# Fix Nginx Multiple Config Files Issue

## Problem
You have TWO nginx config files enabled:
- `/etc/nginx/sites-enabled/crm` → `/etc/nginx/sites-available/crm`
- `/etc/nginx/sites-enabled/default` → `/etc/nginx/sites-available/default`

Both are being loaded, which can cause conflicts.

## Solution

### Option 1: Check what's in the `crm` config file

```bash
sudo cat /etc/nginx/sites-available/crm
```

If it only has CRM config and not TMS, you need to either:
- Add TMS config to it, OR
- Disable it and use only `default`

### Option 2: Disable the `crm` config (Recommended)

If the `default` config has both CRM and TMS, disable the `crm` config:

```bash
sudo rm /etc/nginx/sites-enabled/crm
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Merge configs into one file

Keep only the `default` config with both apps, or merge everything into `crm` config.

## Quick Fix Steps

1. **Check what's in the crm config:**
```bash
sudo cat /etc/nginx/sites-available/crm
```

2. **If it doesn't have TMS config, disable it:**
```bash
sudo rm /etc/nginx/sites-enabled/crm
```

3. **Make sure default has both:**
```bash
sudo cat /etc/nginx/sites-available/default | grep -E "location /(crm|tms)"
```

4. **Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

5. **Test again:**
```bash
curl -s http://localhost/crm | grep -o "<title>.*</title>"
curl -s http://localhost/tms | grep -o "<title>.*</title>"
```

