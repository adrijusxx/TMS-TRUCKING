import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API route to clear all NextAuth session cookies
 * This helps when you get "no matching decryption secret" errors
 * 
 * Usage: POST /api/auth/clear-session
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // List of NextAuth cookie names to clear
    const nextAuthCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'authjs.session-token',
      'authjs.csrf-token',
    ];

    // Clear all NextAuth cookies
    const clearedCookies: string[] = [];
    for (const cookieName of nextAuthCookies) {
      try {
        cookieStore.delete(cookieName);
        clearedCookies.push(cookieName);
      } catch (e) {
        // Cookie might not exist, that's okay
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session cookies cleared',
      clearedCookies,
    });
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear session',
      },
      { status: 500 }
    );
  }
}

