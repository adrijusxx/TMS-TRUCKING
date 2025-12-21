# 🚀 TMS VM Deployment Guide

## Overview
This guide will help you deploy the TMS (Trucking Management System) to your VM alongside your existing CRM application.

**VM IP:** `130.211.211.214`  
**CRM Port:** `3000` (already running)  
**TMS Port:** `3001` (new)  
**Access URL:** `http://130.211.211.214/tms` (via Nginx reverse proxy)

---

## Prerequisites

- SSH access to your VM
- Node.js and npm installed
- PostgreSQL database (local or cloud)
- PM2 installed globally: `npm install -g pm2`
- Nginx installed and configured

---

## Step 1: Clone Repository on VM

```bash
# Navigate to your projects directory
cd ~

# Clone the TMS repository
git clone https://github.com/adrijusxx/TMS-TRUCKING.git

# Navigate to the project
cd TMS-TRUCKING
```

---

## Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Install PM2 globally if not already installed
npm install -g pm2
```

---

## Step 3: Set Up Environment Variables

Create a `.env` file in the TMS-TRUCKING directory:

```bash
cd ~/TMS-TRUCKING
nano .env
```

Add the following (update with your actual values):

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db?schema=public"

# NextAuth (REQUIRED) - Update URL for production
NEXTAUTH_URL="http://34.121.40.233/tms"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars-long-change-this"

# Optional API Keys
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
SAMSARA_API_KEY=""
SAMSARA_WEBHOOK_SECRET=""
CRON_SECRET=""
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Step 4: Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data (creates admin user)
npm run db:seed
```

---

## Step 5: Build the Application

```bash
# Build for production
npm run build
```

---

## Step 6: Configure Nginx

Update your Nginx configuration to include TMS:

```bash
sudo nano /etc/nginx/sites-available/crm
```

Add the TMS location block (keep your existing CRM configuration):

```nginx
server {
    listen 80;
    server_name 34.121.40.233;

    # CRM App - http://34.121.40.233/crm
    location /crm {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rewrite paths for Next.js
        rewrite ^/crm/?(.*)$ /$1 break;
    }

    # TMS App - http://34.121.40.233/tms
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
        
        # Rewrite paths for Next.js
        rewrite ^/tms/?(.*)$ /$1 break;
    }

    # Default - redirect to CRM
    location / {
        return 301 /crm;
    }
}
```

Test and restart Nginx:

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 7: Start TMS with PM2

```bash
cd ~/TMS-TRUCKING

# Start TMS on port 3001
pm2 start npm --name "tms" -- start -- -p 3001

# Save PM2 configuration (auto-start on reboot)
pm2 save

# View status
pm2 list
```

---

## Step 8: Verify Deployment

1. **Check PM2 Status:**
   ```bash
   pm2 list
   pm2 logs tms
   ```

2. **Access TMS:**
   - Main URL: `http://34.121.40.233/tms`
   - Login: `http://34.121.40.233/tms/login`

3. **Default Login Credentials:**
   - Email: `admin@demo.com`
   - Password: `admin123`

---

## PM2 Management Commands

```bash
# View all running apps
pm2 list

# View TMS logs
pm2 logs tms

# Restart TMS
pm2 restart tms

# Stop TMS
pm2 stop tms

# Start TMS
pm2 start tms

# Delete TMS from PM2
pm2 delete tms

# Monitor all apps
pm2 monit
```

---

## Updating TMS

When you need to update the application:

```bash
cd ~/TMS-TRUCKING

# Pull latest changes
git pull

# Install new dependencies (if any)
npm install

# Run database migrations (if any)
npm run db:migrate

# Rebuild the application
npm run build

# Restart with PM2
pm2 restart tms
```

---

## Troubleshooting

### TMS Not Accessible

1. **Check if TMS is running:**
   ```bash
   pm2 list
   pm2 logs tms
   ```

2. **Check if port 3001 is listening:**
   ```bash
   netstat -tulpn | grep 3001
   # or
   ss -tulpn | grep 3001
   ```

3. **Check Nginx configuration:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Check firewall:**
   ```bash
   sudo ufw status
   # If needed, allow ports:
   sudo ufw allow 3001
   ```

### Database Connection Issues

1. **Verify DATABASE_URL in .env:**
   ```bash
   cat ~/TMS-TRUCKING/.env | grep DATABASE_URL
   ```

2. **Test database connection:**
   ```bash
   cd ~/TMS-TRUCKING
   npm run db:studio
   ```

### Build Errors

1. **Clear Next.js cache:**
   ```bash
   cd ~/TMS-TRUCKING
   rm -rf .next
   npm run build
   ```

2. **Check Node.js version:**
   ```bash
   node -v  # Should be 18.x or higher
   ```

---

## Environment-Specific Configuration

### Production Environment Variables

Make sure your `.env` file has production-ready values:

```env
NODE_ENV=production
NEXTAUTH_URL=http://34.121.40.233/tms
DATABASE_URL=postgresql://...  # Your production database
```

---

## Security Recommendations

1. **Set up SSL/HTTPS** (if you have a domain):
   - Use Let's Encrypt with Certbot
   - Update Nginx to use HTTPS

2. **Firewall Configuration:**
   - Only expose ports 80 and 443
   - Keep ports 3000, 3001 internal

3. **Environment Variables:**
   - Never commit `.env` file
   - Use strong `NEXTAUTH_SECRET`
   - Rotate secrets regularly

---

## Quick Reference

| Service | Port | URL | PM2 Name |
|---------|------|-----|----------|
| CRM | 3000 | http://34.121.40.233/crm | crm |
| TMS | 3001 | http://34.121.40.233/tms | tms |

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs tms`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables are set correctly
4. Ensure database is accessible and migrations are up to date

