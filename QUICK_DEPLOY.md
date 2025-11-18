# ⚡ Quick Deploy Guide - TMS to VM

## One-Command Setup (After Initial Setup)

```bash
cd ~/TMS-TRUCKING
./deploy.sh
```

---

## Manual Step-by-Step (First Time)

### 1. Clone and Navigate
```bash
cd ~
git clone https://github.com/adrijusxx/TMS-TRUCKING.git
cd TMS-TRUCKING
```

### 2. Run Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install dependencies
- Create .env template (if missing)
- Generate Prisma Client
- Run migrations
- Build the app
- Start with PM2 on port 3001

### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/crm
```

Add the TMS location block (see `nginx-tms-config.conf` for full config):

```nginx
location /tms {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    rewrite ^/tms/?(.*)$ /$1 break;
}
```

Then:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Update .env File

```bash
nano ~/TMS-TRUCKING/.env
```

Make sure these are set:
```env
NEXTAUTH_URL="http://34.121.40.233/tms"
DATABASE_URL="your-database-connection-string"
```

### 5. Access TMS

- URL: `http://34.121.40.233/tms`
- Login: `http://34.121.40.233/tms/login`
- Default credentials: `admin@demo.com` / `admin123`

---

## Update TMS (After Code Changes)

```bash
cd ~/TMS-TRUCKING
git pull
npm install
npm run db:migrate  # If there are new migrations
npm run build
pm2 restart tms
```

---

## Useful Commands

```bash
# View TMS logs
pm2 logs tms

# Restart TMS
pm2 restart tms

# Check status
pm2 list

# Stop TMS
pm2 stop tms
```

