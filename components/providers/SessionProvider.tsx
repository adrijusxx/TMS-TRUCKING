'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // NextAuth v5 (Auth.js) should auto-detect basePath, but if client-side API calls
  // are failing, we may need to explicitly configure it
  // For now, let NextAuth auto-detect from Next.js config and NEXTAUTH_URL
  // If issues persist, we can add basePath prop: basePath={process.env.NEXT_PUBLIC_BASE_PATH || '/tms'}
  return (
    <NextAuthSessionProvider
      basePath={process.env.NEXT_PUBLIC_BASE_PATH || '/tms'}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

