import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';

/**
 * GET /api/users/staff
 * Get staff users for assignments (non-driver users)
 */
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const recruiterOnly = searchParams.get('recruiter') === 'true';

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      isActive: true,
      role: { notIn: ['DRIVER', 'CUSTOMER'] },
    };

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

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
});
