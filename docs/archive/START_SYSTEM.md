# 🚀 How to Start the TMS System

## Quick Start Commands

### Step 1: Check/Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db?schema=public"

# NextAuth (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars-long-change-this"

# Optional (for future features)
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
SAMSARA_API_KEY=""
SAMSARA_WEBHOOK_SECRET=""
CRON_SECRET=""
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))

# Or use online generator: https://generate-secret.vercel.app/32
```

### Step 3: Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database and run migrations
npm run db:migrate

# (Optional) Seed database with sample data
npm run db:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

The system will start at: **http://localhost:3000**

---

## Complete Startup Sequence

Run these commands in order:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Run database migrations
npm run db:migrate

# 4. Seed database (creates admin user and sample data)
npm run db:seed

# 5. Start development server
npm run dev
```

---

## Default Login Credentials

After seeding, you can login with:
- **Email:** `admin@demo.com`
- **Password:** `admin123`

---

## Access Points

- **Main Application:** http://localhost:3000
- **Login Page:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard (after login)
- **Mobile Driver Interface:** http://localhost:3000/mobile/driver (driver account required)
- **Prisma Studio (Database GUI):** Run `npm run db:studio` in separate terminal

---

## Troubleshooting

### Database Connection Error
```bash
# Make sure PostgreSQL is running
# Check DATABASE_URL in .env file
# Verify database exists
```

### Prisma Client Errors
```bash
npm run db:generate
```

### Port Already in Use
```bash
# Change port in package.json or use:
npm run dev -- -p 3001
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:seed          # Seed database

# Other
npm run lint             # Run linter
```

