# Quick Steps to Update VM IP

**New IP:** `130.211.211.214`  
**Old IP:** `34.121.40.233`

---

## 🔧 On VM (SSH into it first):

```bash
ssh telegram-userbot-vm@130.211.211.214
```

### 1. Update Nginx Config:

```bash
sudo nano /etc/nginx/sites-available/crm
```

Find this line:
```nginx
server_name 34.121.40.233;
```

Change to:
```nginx
server_name 130.211.211.214;
```

Save: `Ctrl+X`, `Y`, `Enter`

Test and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Update .env file:

```bash
cd /home/telegram-userbot-vm/TMS-TRUCKING
nano .env
```

Find this line:
```env
NEXTAUTH_URL="http://34.121.40.233/tms"
```

Change to:
```env
NEXTAUTH_URL="http://130.211.211.214/tms"
```

Save: `Ctrl+X`, `Y`, `Enter`

Restart app:
```bash
pm2 restart tms --update-env
```

### 3. Verify:

```bash
# Check app is running
pm2 logs tms --lines 10

# Test from VM
curl -I http://localhost/tms
```

---

## ✅ That's it!

Your TMS should now be accessible at: **http://130.211.211.214/tms**

---

**Note:** The deploy script (`deploy-to-vm.ps1`) has already been updated with the new IP.

