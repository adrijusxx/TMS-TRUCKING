import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/staff
 * Get staff users for assignments (non-driver users)
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const recruiterOnly = searchParams.get('recruiter') === 'true';

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      isActive: true,
      role: { notIn: ['DRIVER', 'CUSTOMER'] }, // Exclude drivers and customers
    };

    // Filter to only users with an active RecruiterProfile
    if (recruiterOnly) {
      where.recruiterProfile = { isActive: true };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: limit,
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}












