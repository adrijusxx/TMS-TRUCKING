'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Get basePath from environment variable only (not from URL path)
  // For subdomain deployment (tms.vaidera.eu): basePath should be empty
  // For subdirectory deployment (domain.com/tms): basePath should be '/tms'
  // Don't detect from URL as it may already have basePath appended
  const basePath = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
    : (process.env.NEXT_PUBLIC_BASE_PATH || '');
  
  // NextAuth v5 client-side needs basePath to construct correct API URLs
  // The basePath should be the app's basePath (e.g., '/tms' or ''), not '/tms/api/auth'
  // NextAuth will append '/api/auth' automatically
  // For subdomain: basePath is '', so NextAuth path is '/api/auth'
  // For subdirectory: basePath is '/tms', so NextAuth path is '/tms/api/auth'
  const nextAuthBasePath = basePath ? `${basePath}/api/auth` : '/api/auth';
  
  return (
    <NextAuthSessionProvider basePath={nextAuthBasePath}>
      {children}
    </NextAuthSessionProvider>
  );
}

