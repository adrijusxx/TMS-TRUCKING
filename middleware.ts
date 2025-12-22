/**
 * Next.js Middleware
 * 
 * Ensures AWS Secrets Manager secrets are initialized before handling requests.
 * This runs early in the request lifecycle, before any route handlers.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeSecrets, isInitialized } from '@/lib/secrets/initialize';

export async function middleware(request: NextRequest) {
  // Initialize secrets if not already initialized
  // This only runs once per application instance
  if (!isInitialized()) {
    try {
      await initializeSecrets();
    } catch (error) {
      console.error('[Middleware] Failed to initialize secrets:', error);
      // In production, you might want to return an error response
      // For now, we'll continue and let individual routes handle missing secrets
    }
  }

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
