#!/bin/bash

# TMS Deployment Script for VM
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting TMS Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the TMS-TRUCKING directory.${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 2: Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
    cat > .env << EOF
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db?schema=public"

# NextAuth (REQUIRED)
NEXTAUTH_URL="http://34.121.40.233/tms"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Optional API Keys
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
SAMSARA_API_KEY=""
SAMSARA_WEBHOOK_SECRET=""
CRON_SECRET=""
EOF
    echo -e "${GREEN}✅ .env file created. Please update DATABASE_URL and other values.${NC}"
    echo -e "${YELLOW}Press Enter to continue after updating .env file...${NC}"
    read
fi

# Step 3: Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npm run db:generate

# Step 4: Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run db:migrate || echo -e "${YELLOW}⚠️  Migration may have failed. Please check your DATABASE_URL.${NC}"

# Step 5: Seed database (optional)
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    npm run db:seed || echo -e "${YELLOW}⚠️  Seeding may have failed.${NC}"
fi

# Step 6: Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

# Step 7: Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2 globally...${NC}"
    npm install -g pm2
fi

# Step 8: Stop existing TMS instance if running
if pm2 list | grep -q "tms"; then
    echo -e "${YELLOW}🛑 Stopping existing TMS instance...${NC}"
    pm2 delete tms || true
fi

# Step 9: Start TMS with PM2
echo -e "${YELLOW}🚀 Starting TMS with PM2 on port 3001...${NC}"
pm2 start npm --name "tms" -- start -- -p 3001

# Step 10: Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}📊 PM2 Status:${NC}"
pm2 list

echo ""
echo -e "${GREEN}🌐 Access TMS at: http://34.121.40.233/tms${NC}"
echo -e "${GREEN}📝 View logs: pm2 logs tms${NC}"
echo -e "${GREEN}🔄 Restart: pm2 restart tms${NC}"

