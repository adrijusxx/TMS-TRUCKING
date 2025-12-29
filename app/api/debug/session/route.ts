import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      data: {
        authenticated: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          companyId: session.user.companyId,
          currentCompanyId: session.user.currentCompanyId,
          mcNumberId: session.user.mcNumberId,
          mcNumber: session.user.mcNumber,
        } : null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Debug Session] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to get session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
