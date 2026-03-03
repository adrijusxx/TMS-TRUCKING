import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const tag = await prisma.tag.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
  });

  if (!tag) {
    throw new NotFoundError('Tag');
  }

  return successResponse(tag);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTagSchema.parse(body);

    const existing = await prisma.tag.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Tag');
    }

    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.tag.findFirst({
        where: {
          companyId: session.user.companyId,
          name: validatedData.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new ConflictError('Tag name already exists');
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: validatedData,
    });

    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const existing = await prisma.tag.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Tag');
  }

  await prisma.tag.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return successResponse({ message: 'Tag deleted successfully' });
});
