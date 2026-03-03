import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

/**
 * Delete a deduction type template
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const existing = await prisma.deductionTypeTemplate.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
    },
  });

  if (!existing) {
    throw new NotFoundError('Template');
  }

  await prisma.deductionTypeTemplate.delete({
    where: { id },
  });

  return successResponse({ message: 'Template deleted' });
});
