import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Clear all auth-related cookies
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('next-auth') ||
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('currentMcNumberId') ||
      cookie.name.includes('currentMcNumber') ||
      cookie.name.includes('mcViewMode')
    );
    
    console.log('[Clear Session] Found cookies to clear:', authCookies.map(c => c.name));
    
    // Clear each cookie
    authCookies.forEach(cookie => {
      cookieStore.delete(cookie.name);
    });
    
    return NextResponse.json({
      success: true,
      message: 'Session cleared. Please log in again.',
      clearedCookies: authCookies.map(c => c.name)
    });
  } catch (error) {
    console.error('[Clear Session] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to clear session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}





