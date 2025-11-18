import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // Extract basePath from the request URL
  // The pathname could be:
  // - /tms/api/auth/error (when accessed through nginx with basePath)
  // - /api/auth/error (when NextAuth redirects without basePath - we need to detect from referrer or origin)
  const pathname = request.nextUrl.pathname;
  let basePath = '';
  
  // Check if pathname includes basePath
  if (pathname.startsWith('/tms/')) {
    basePath = '/tms';
  } else if (pathname.startsWith('/crm/')) {
    basePath = '/crm';
  } else {
    // If pathname doesn't have basePath, check referer header or origin
    const referer = request.headers.get('referer') || '';
    if (referer.includes('/tms')) {
      basePath = '/tms';
    } else if (referer.includes('/crm')) {
      basePath = '/crm';
    } else {
      // Fallback to env var
      basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
    }
  }
  
  // Construct login URL with basePath
  // Use the request URL's origin to construct the full URL
  const origin = request.nextUrl.origin;
  const loginUrl = new URL(`${basePath}/login`, origin);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  return NextResponse.redirect(loginUrl);
}

