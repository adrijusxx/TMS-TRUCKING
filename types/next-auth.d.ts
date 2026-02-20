import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName?: string;
      lastName?: string;
      /** @deprecated Use roleId/roleSlug instead. Kept during migration. */
      role: string;
      roleId?: string;
      roleSlug: string;
      roleName: string;
      companyId: string;
      currentCompanyId?: string;
      mcNumberId?: string;
      mcNumber?: string;
      mcAccess?: string[]; // Array of MC IDs user can access (empty for admins = access to all)
    };
  }

  interface User {
    role: string;
    roleId?: string;
    roleSlug: string;
    roleName: string;
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
    role: string;
    roleId?: string;
    roleSlug: string;
    roleName: string;
    companyId: string;
    currentCompanyId?: string;
    mcNumberId?: string;
    mcNumber?: string;
    mcAccess?: string[];
    firstName?: string;
    lastName?: string;
  }
}
