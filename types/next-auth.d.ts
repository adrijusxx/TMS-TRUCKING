import 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName?: string;
      lastName?: string;
      role: UserRole;
      companyId: string;
      currentCompanyId?: string;
      mcNumberId?: string;
      mcNumber?: string;
      mcAccess?: string[]; // Array of MC IDs user can access (empty for admins = access to all)
    };
  }

  interface User {
    role: UserRole;
    companyId: string;
    firstName?: string;
    lastName?: string;
    mcNumberId?: string;
    mcNumber?: string;
    mcAccess?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    companyId: string;
    currentCompanyId?: string;
    mcNumberId?: string;
    mcNumber?: string;
    mcAccess?: string[];
    firstName?: string;
    lastName?: string;
  }
}

