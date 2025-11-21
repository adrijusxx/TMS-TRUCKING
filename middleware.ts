import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/tracking'];
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Old routes that should be redirected to /dashboard/* (these routes no longer exist at root)
  const oldProtectedRoutes = ['/loads', '/drivers', '/trucks', '/customers', '/invoices', '/settlements', '/analytics', '/dispatch', '/documents', '/settings', '/edi', '/loadboard', '/automation'];
  const isOldRoute = oldProtectedRoutes.some((route) => {
    // Match exact route or route with path segments (but not /dashboard/...)
    return pathname === route || (pathname.startsWith(route + '/') && !pathname.startsWith('/dashboard/'));
  });

  // Redirect old routes to dashboard equivalent
  if (isOldRoute) {
    // Extract the route name (e.g., '/customers' -> 'customers')
    const routeName = pathname.split('/')[1];
    const redirectPath = pathname.replace(`/${routeName}`, `/dashboard/${routeName}`);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Protect /dashboard/* routes - let the layout handle auth check
  // The layout will redirect to /login if not authenticated
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    // Check for session token in middleware as well for extra security
    const sessionToken = request.cookies.get('authjs.session-token') || 
                        request.cookies.get('__Secure-authjs.session-token') ||
                        request.cookies.get('next-auth.session-token') ||
                        request.cookies.get('__Secure-next-auth.session-token');
    
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }

  // Protect /mobile routes - let the layout handle auth check
  // The layout will redirect to /login if not authenticated
  if (pathname.startsWith('/mobile')) {
    // Optional: Check for session token for extra security, but don't block
    // Let the server-side layout handle authentication
    // This allows the layout to show helpful messages if user is not a driver
    return NextResponse.next();
  }

  // API routes protection (except public endpoints)
  if (pathname.startsWith('/api/')) {
    const publicApiRoutes = ['/api/auth', '/api/mobile/auth'];
    const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

    if (!isPublicApiRoute) {
      const sessionToken = request.cookies.get('authjs.session-token') || 
                          request.cookies.get('__Secure-authjs.session-token') ||
                          request.cookies.get('next-auth.session-token') ||
                          request.cookies.get('__Secure-next-auth.session-token');
      
      if (!sessionToken) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

