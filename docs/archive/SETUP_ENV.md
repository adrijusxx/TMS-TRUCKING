# 🔧 Environment Setup

## Required Steps Before Starting

### 1. Set Up Your `.env` File

Your `.env` file needs at minimum these two variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key-here-min-32-chars"
```

#### Optional API Integrations

```env
# Google Maps API (for distance calculation and route planning)
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# QuickBooks Integration (for invoice/expense sync)
QUICKBOOKS_CLIENT_ID=""
QUICKBOOKS_CLIENT_SECRET=""
QUICKBOOKS_ENVIRONMENT="sandbox" # or "production"

# Samsara API (for ELD/HOS integration)
SAMSARA_API_KEY=""
SAMSARA_WEBHOOK_SECRET=""

# DeepSeek API (for AI load importer)
DEEPSEEK_API_KEY=""
```

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Make sure PostgreSQL is installed and running
# Update DATABASE_URL with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tms_db?schema=public"
```

**Option B: Use a Cloud Database (Recommended for testing)**
- **Neon (Free PostgreSQL):** https://neon.tech
- **Supabase (Free PostgreSQL):** https://supabase.com
- **Railway:** https://railway.app

Copy the connection string they provide to your `DATABASE_URL`

### 3. Generate NEXTAUTH_SECRET

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Or use online generator:**
https://generate-secret.vercel.app/32

### 4. Complete Setup Commands

```bash
# 1. Make sure .env file has DATABASE_URL and NEXTAUTH_SECRET
# 2. Generate Prisma Client
npm run db:generate

# 3. Create database tables
npm run db:migrate

# 4. Seed with sample data
npm run db:seed

# 5. Start the server
npm run dev
```

---

## Quick Test

After setup, visit: http://localhost:3000/login

Login with:
- Email: `admin@demo.com`
- Password: `admin123`

