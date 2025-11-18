# Database Setup Guide

## Quick Setup Options

### Option 1: Use Neon (Free PostgreSQL Cloud Database) - RECOMMENDED

1. Go to https://neon.tech and sign up (free)
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. Update your `.env` file:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

5. Then run:
```bash
npm run db:migrate
npm run db:seed
```

### Option 2: Use Supabase (Free PostgreSQL)

1. Go to https://supabase.com and sign up (free)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Update your `.env` file with the connection string
6. Run migrations

### Option 3: Local PostgreSQL

1. Install PostgreSQL on your computer
2. Create a database:
```sql
CREATE DATABASE tms_db;
```

3. Update your `.env` file:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tms_db?schema=public"
```

4. Run migrations:
```bash
npm run db:migrate
npm run db:seed
```

### Option 4: Use Railway (Free Tier)

1. Go to https://railway.app and sign up
2. Create a new PostgreSQL database
3. Copy the connection string
4. Update your `.env` file
5. Run migrations

---

## After Setting Up Database

Once you have a valid DATABASE_URL in your `.env` file:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Run migrations (creates tables)
npm run db:migrate

# 3. Seed database (creates admin user)
npm run db:seed
```

---

## Test Your Connection

After updating `.env`, test the connection:

```bash
npm run db:studio
```

This opens Prisma Studio where you can view your database.

---

## Default Login After Seeding

- **Email:** `admin@demo.com`
- **Password:** `admin123`

---

## Troubleshooting

### "Can't reach database server"
- Make sure your DATABASE_URL is correct
- For cloud databases, check if the service is running
- For local PostgreSQL, make sure the service is running

### "Environment variable not found"
- Make sure `.env` file is in the root directory
- Make sure DATABASE_URL is not commented out (no `#` before it)
- Restart your terminal/IDE after updating `.env`







