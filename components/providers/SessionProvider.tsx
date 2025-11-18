'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Get basePath from environment or detect from window.location
  const getBasePath = () => {
    // Client-side: detect from current URL
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/tms')) return '/tms';
      if (pathname.startsWith('/crm')) return '/crm';
    }
    // Fallback to env var (for SSR)
    return process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  };

  const basePath = getBasePath();
  
  // NextAuth v5 client-side needs basePath to construct correct API URLs
  // The basePath should be the app's basePath (e.g., '/tms'), not '/tms/api/auth'
  // NextAuth will append '/api/auth' automatically
  // This fixes the "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" error
  // which happens when NextAuth calls /api/auth/session instead of /tms/api/auth/session
  return (
    <NextAuthSessionProvider basePath={`${basePath}/api/auth`}>
      {children}
    </NextAuthSessionProvider>
  );
}

