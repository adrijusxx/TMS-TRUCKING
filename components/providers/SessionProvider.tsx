'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // NextAuth v5 (Auth.js) automatically detects basePath from Next.js config
  // No need to manually pass basePath - it will use the basePath from next.config.js
  // The NEXTAUTH_URL environment variable should include the basePath
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}

