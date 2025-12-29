import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/on-call/users
 * Get users eligible for on-call assignments (dispatchers, admins, fleet managers)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get users who can be assigned on-call (dispatchers, admins, etc.)
    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        isActive: true,
        role: {
          in: ['ADMIN', 'DISPATCHER', 'ACCOUNTANT'], // Roles that can be on-call
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error: any) {
    console.error('Error fetching on-call users:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch on-call users',
        },
      },
      { status: 500 }
    );
  }
}

