# Update VM IP Address to 130.211.211.214

## Overview

Your VM IP has changed from `34.121.40.233` to `130.211.211.214`. You need to update:

1. ✅ Nginx configuration (on VM)
2. ✅ NEXTAUTH_URL in .env file (on VM)
3. ✅ Deploy script (already updated)

---

## Step 1: Update Nginx Configuration (ON VM)

SSH into your VM:

```bash
ssh telegram-userbot-vm@130.211.211.214
```

Edit the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/crm
# or
sudo nano /etc/nginx/sites-enabled/crm
```

**Find and update the `server_name` line:**

**Change from:**
```nginx
server_name 34.121.40.233;
```

**Change to:**
```nginx
server_name 130.211.211.214;
```

**Also check if there are any other references to the old IP in the config file.**

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

Test Nginx configuration:

```bash
sudo nginx -t
```

If test passes, restart Nginx:

```bash
sudo systemctl restart nginx
# or
sudo service nginx restart
```

Verify Nginx is running:

```bash
sudo systemctl status nginx
```

- [ ] Nginx config updated
- [ ] Nginx config tested
- [ ] Nginx restarted

---

## Step 2: Update NEXTAUTH_URL in .env File (ON VM)

Still on the VM, update the `.env` file:

```bash
cd /home/telegram-userbot-vm/TMS-TRUCKING
nano .env
```

**Find the NEXTAUTH_URL line and update:**

**Change from:**
```env
NEXTAUTH_URL="http://34.121.40.233/tms"
```

**Change to:**
```env
NEXTAUTH_URL="http://130.211.211.214/tms"
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

Restart the TMS application:

```bash
pm2 restart tms --update-env
```

Verify it's running:

```bash
pm2 logs tms --lines 20
```

- [ ] .env file updated with new NEXTAUTH_URL
- [ ] Application restarted
- [ ] Application is running without errors

---

## Step 3: Verify Everything Works

### Test from Local Machine:

1. **Test Nginx routing:**
   ```bash
   curl -I http://130.211.211.214/tms
   ```
   Should return HTTP 200 or redirect to login

2. **Test in browser:**
   - Open: http://130.211.211.214/tms
   - Should load the TMS application
   - Login should work

3. **Check application logs on VM:**
   ```bash
   pm2 logs tms --lines 50
   ```
   Should not show any connection errors

- [ ] Application accessible at new IP
- [ ] Login works
- [ ] No errors in logs

---

## Step 4: Update Firewall Rules (if needed)

If you have firewall rules that reference the old IP, you may need to update them. However, since this is an external IP change, firewall rules typically don't need updating (they work with ports, not IPs).

If you're using Google Cloud firewall rules, they might need updating if they reference the old IP.

---

## Summary of Changes

| Item | Old Value | New Value |
|------|-----------|-----------|
| VM IP | 34.121.40.233 | 130.211.211.214 |
| Nginx server_name | 34.121.40.233 | 130.211.211.214 |
| NEXTAUTH_URL | http://34.121.40.233/tms | http://130.211.211.214/tms |
| Access URL | http://34.121.40.233/tms | http://130.211.211.214/tms |

---

## Troubleshooting

### Nginx won't restart:

```bash
# Check for syntax errors
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Application won't start:

```bash
# Check PM2 logs
pm2 logs tms --lines 50

# Check if port 3001 is in use
netstat -tulpn | grep 3001

# Restart PM2
pm2 restart tms --update-env
```

### Can't access application:

1. Check Nginx is running: `sudo systemctl status nginx`
2. Check TMS is running: `pm2 list`
3. Check firewall allows port 80: `sudo ufw status`
4. Test direct connection: `curl http://localhost:3001/tms`

---

**Last Updated:** 2025-12-20  
**New VM IP:** 130.211.211.214

