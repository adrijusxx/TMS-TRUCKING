import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: true,
        mcNumber: true
      }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        sessionData: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          companyId: session.user.companyId
        },
        databaseData: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          isActive: user.isActive,
          company: user.company.name
        },
        mismatch: session.user.role !== user.role,
        message: session.user.role !== user.role 
          ? `⚠️ MISMATCH: Session has role "${session.user.role}" but database has "${user.role}". Please log out and log back in.`
          : '✅ Session matches database'
      }
    });
  } catch (error) {
    console.error('[Force Refresh] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to refresh session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

