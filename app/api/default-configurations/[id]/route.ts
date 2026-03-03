import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const updateConfigSchema = z.object({
  value: z.any().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const mcWhere = await buildMcNumberIdWhereClause(session, request);

  const config = await prisma.defaultConfiguration.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!config) {
    throw new NotFoundError('Configuration');
  }

  return successResponse(config);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.defaultConfiguration.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Configuration');
    }

    const updateData: any = { ...validatedData };
    if (validatedData.value !== undefined) {
      updateData.value = typeof validatedData.value === 'string'
        ? validatedData.value
        : JSON.stringify(validatedData.value);
    }

    const config = await prisma.defaultConfiguration.update({
      where: { id },
      data: updateData,
    });

    return successResponse(config);
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

  const mcWhere = await buildMcNumberIdWhereClause(session, request);
  const existing = await prisma.defaultConfiguration.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Configuration');
  }

  await prisma.defaultConfiguration.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return successResponse({ message: 'Configuration deleted successfully' });
});
