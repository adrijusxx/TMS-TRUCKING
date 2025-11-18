import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // Extract basePath from the request URL
  const pathname = request.nextUrl.pathname;
  const basePath = pathname.startsWith('/tms') ? '/tms' 
    : pathname.startsWith('/crm') ? '/crm'
    : process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  
  // Redirect to login page with error message (respecting basePath)
  const loginUrl = new URL(`${basePath}/login`, request.url);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  return NextResponse.redirect(loginUrl);
}

