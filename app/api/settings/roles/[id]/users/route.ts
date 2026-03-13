import { NextRequest } from 'next/server';
import { withPermission, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/roles/[id]/users — Get users assigned to a role
 */
export const GET = withPermission('users.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const companyId = session.user.companyId;

    const users = await prisma.user.findMany({
      where: { roleId: id, companyId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
});
