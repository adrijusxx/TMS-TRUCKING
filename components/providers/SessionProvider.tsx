'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // NextAuth v5 (Auth.js) automatically detects basePath from Next.js config (next.config.js)
  // and from NEXTAUTH_URL environment variable
  // DO NOT set basePath prop - it causes NextAuth to call wrong URLs like /tms/session
  // instead of /tms/api/auth/session
  // NextAuth will auto-detect /tms from next.config.js basePath setting
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}

