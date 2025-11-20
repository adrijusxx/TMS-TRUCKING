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
    };
  }

  interface User {
    role: UserRole;
    companyId: string;
    firstName?: string;
    lastName?: string;
    mcNumberId?: string;
    mcNumber?: string;
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
    firstName?: string;
    lastName?: string;
  }
}

