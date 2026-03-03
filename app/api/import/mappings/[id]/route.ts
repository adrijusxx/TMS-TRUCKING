import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';

export const DELETE = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  if (!id) {
    throw new BadRequestError('Mapping ID is required');
  }

  const existingMapping = await prisma.importMappingProfile.findUnique({
    where: { id },
  });

  if (!existingMapping) {
    throw new NotFoundError('Mapping');
  }

  if (existingMapping.userId !== session.user.id) {
    throw new ForbiddenError('Not authorized to delete this mapping');
  }

  await prisma.importMappingProfile.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
});
