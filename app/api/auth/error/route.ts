import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // Extract basePath from the request URL to construct the correct redirect
  // The pathname will be like /tms/api/auth/error or /crm/api/auth/error
  const pathname = request.nextUrl.pathname;
  let basePath = '';
  
  if (pathname.startsWith('/tms/')) {
    basePath = '/tms';
  } else if (pathname.startsWith('/crm/')) {
    basePath = '/crm';
  } else {
    // Fallback to env var
    basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  }
  
  // Construct login URL with basePath (NextResponse.redirect doesn't auto-add basePath)
  const loginUrl = new URL(`${basePath}/login`, request.url);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  return NextResponse.redirect(loginUrl);
}

