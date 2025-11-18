'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // NextAuth should automatically detect basePath from Next.js config
  // But we can also extract it from the current URL as a fallback
  const getBasePath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/tms')) return '/tms';
      if (pathname.startsWith('/crm')) return '/crm';
    }
    // This should be available at build time
    return process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  };

  const basePath = getBasePath();
  
  // For NextAuth v5 (Auth.js), we need to ensure the basePath is used
  // The basePath prop tells NextAuth where the API routes are
  return (
    <NextAuthSessionProvider basePath={`${basePath}/api/auth`}>
      {children}
    </NextAuthSessionProvider>
  );
}

