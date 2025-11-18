# Complete TMS Setup Instructions

## Step-by-Step Setup Guide

### STEP 1: Create Project

```bash
# Create Next.js project
npx create-next-app@latest tms-trucking --typescript --tailwind --app --use-npm --no-src-dir

cd tms-trucking
```

### STEP 2: Install Dependencies

```bash
# Core dependencies
npm install @prisma/client @tanstack/react-query zustand react-hook-form @hookform/resolvers zod
npm install date-fns lucide-react recharts next-auth@beta bcryptjs
npm install class-variance-authority clsx tailwind-merge

# Dev dependencies
npm install -D prisma @types/bcryptjs tsx

# Initialize Prisma
npx prisma init
```

### STEP 3: Create Directory Structure

```bash
# Create all necessary directories
mkdir -p docs
mkdir -p components/{ui,loads,drivers,trucks,dispatch,customers,analytics,layout}
mkdir -p lib/{utils,validations,api,integrations}
mkdir -p types
mkdir -p hooks
mkdir -p app/api/{loads,drivers,trucks,dispatch,customers,documents,analytics,auth}
mkdir -p app/(dashboard)/{loads,drivers,trucks,dispatch,customers,analytics,settings}
mkdir -p app/(auth)/{login,register}

# Create essential files
touch .cursorrules
touch docs/PROGRESS.md
touch docs/ARCHITECTURE.md
touch docs/DATABASE_SCHEMA.md
touch docs/API_REFERENCE.md
touch docs/INTEGRATION_GUIDE.md
touch lib/prisma.ts
touch lib/auth.ts
touch types/index.ts
touch middleware.ts
```

### STEP 4: Set Up Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-random-string-here-min-32-chars"

# AWS S3 (for documents)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="tms-documents"

# QuickBooks (Phase 1)
QUICKBOOKS_CLIENT_ID=""
QUICKBOOKS_CLIENT_SECRET=""
QUICKBOOKS_REDIRECT_URI="http://localhost:3000/api/integrations/quickbooks/callback"
QUICKBOOKS_ENVIRONMENT="sandbox"

# ELD Integration (Phase 2)
SAMSARA_API_KEY=""
SAMSARA_WEBHOOK_SECRET=""

# Load Boards (Phase 2)
DAT_API_KEY=""
DAT_API_SECRET=""

# Maps (Phase 2)
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
```

Create `.env.local` with same structure and your actual values.

### STEP 5: Copy Documentation Files

Copy the content from these artifacts into your files:

1. `.cursorrules` - Copy from the cursorrules artifact
2. `docs/PROGRESS.md` - Copy from PROGRESS.md artifact
3. `docs/ARCHITECTURE.md` - Copy from ARCHITECTURE.md artifact
4. `prisma/schema.prisma` - Copy from both DATABASE_SCHEMA parts (combine them)

### STEP 6: Set Up Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# Open Prisma Studio to verify
npx prisma studio
```

### STEP 7: Create Core Library Files

#### lib/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### lib/auth.ts

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { company: true }
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          companyId: user.companyId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt'
  }
};
```

#### types/index.ts

```typescript
import { UserRole, LoadStatus, DriverStatus, TruckStatus } from '@prisma/client';

export type {
  UserRole,
  LoadStatus,
  DriverStatus,
  TruckStatus
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
}

export interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  customerId: string;
  driverId?: string;
  truckId?: string;
  pickupCity: string;
  pickupState: string;
  pickupDate: Date;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date;
  revenue: number;
  driverPay?: number;
  weight: number;
}
```

#### lib/utils/index.ts

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}
```

### STEP 8: Set Up Authentication Routes

#### app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

#### middleware.ts

```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/loads/:path*',
    '/drivers/:path*',
    '/trucks/:path*',
    '/api/:path*'
  ]
};
```

### STEP 9: Install shadcn/ui Components

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# When prompted, choose:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Install essential components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add form
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
```

### STEP 10: Create Seed Data

#### prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create company
  const company = await prisma.company.upsert({
    where: { dotNumber: '1234567' },
    update: {},
    create: {
      name: 'Demo Trucking LLC',
      dotNumber: '1234567',
      mcNumber: 'MC-123456',
      address: '123 Main St',
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      phone: '555-0100',
      email: 'office@demotrucking.com'
    }
  });

  console.log('✅ Company created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-0101',
      role: 'ADMIN',
      companyId: company.id
    }
  });

  console.log('✅ Admin user created - Email: admin@demo.com, Password: admin123');

  // Create sample customer
  await prisma.customer.create({
    data: {
      customerNumber: 'C-001',
      name: 'ABC Corporation',
      type: 'DIRECT',
      address: '456 Customer Ave',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      phone: '555-0200',
      email: 'billing@abccorp.com',
      paymentTerms: 30,
      companyId: company.id
    }
  });

  console.log('✅ Sample customer created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:

```bash
npm run seed
```

### STEP 11: Start Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000

# In another terminal, open Prisma Studio
npx prisma studio
```

### STEP 12: Start Building with Cursor

Open the project in Cursor and use this first prompt:

```
I'm ready to start building the TMS. Let's begin with Phase 1: Authentication system.

Create the login page at app/(auth)/login/page.tsx with:
- Email/password form using react-hook-form
- Validation with Zod
- NextAuth integration
- shadcn/ui components
- Mobile responsive design

Follow .cursorrules and check docs/PROGRESS.md for the current phase.
```

## Common Commands

```bash
# Development
npm run dev

# Database
npx prisma studio
npx prisma migrate dev --name [migration_name]
npx prisma generate
npx prisma db seed

# Build
npm run build
npm start

# Type checking
npx tsc --noEmit
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Reset database if needed
npx prisma migrate reset
```

### Prisma Client Errors

```bash
npx prisma generate
npm run dev
```

### Type Errors in Cursor

- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Next Steps

1. ✅ Setup complete
2. Open project in Cursor
3. Review `.cursorrules`
4. Check `docs/PROGRESS.md`
5. Start building authentication
6. Follow phase order from PROGRESS.md

---

**You're ready to build! 🚀**