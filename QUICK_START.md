# 🚀 Quick Start Guide

## To Start the TMS System:

### 1. First Time Setup (if not done already):

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data (creates admin user)
npm run db:seed
```

### 2. Start the Development Server:

```bash
npm run dev
```

### 3. Open in Browser:

- **Main App:** http://localhost:3000
- **Login:** http://localhost:3000/login

**Default Login:**
- Email: `admin@demo.com`
- Password: `admin123`

---

## If You Get Errors:

### Database Connection Error:
- Make sure PostgreSQL is running
- Check your `.env` file has correct `DATABASE_URL`

### Prisma Client Error:
```bash
npm run db:generate
```

### Missing Dependencies:
```bash
npm install
```

---

## Useful Commands:

```bash
npm run dev          # Start development server
npm run db:studio    # Open database GUI (in separate terminal)
npm run build        # Build for production
```

