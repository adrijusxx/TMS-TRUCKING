/**
 * Next.js Middleware
 * 
 * Middleware runs early in the request lifecycle.
 * 
 * Note: Secrets initialization should happen at application startup (e.g., in an API route
 * or startup script) rather than in middleware, as middleware runs in a constrained context.
 * 
 * This middleware currently just passes through requests.
 * Secrets are initialized via lib/secrets/initialize.ts when the application starts.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Secrets initialization is handled at application startup, not in middleware
  // This avoids issues with AWS SDK in middleware context and build-time resolution
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and API routes that don't need secrets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
