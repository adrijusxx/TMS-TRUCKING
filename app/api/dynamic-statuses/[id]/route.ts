import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';
import { EntityType } from '@prisma/client';

const updateStatusSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  isDefault: z.boolean().optional(),
  workflowRules: z.any().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const mcWhere = await buildMcNumberIdWhereClause(session, request);

  const status = await prisma.dynamicStatus.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!status) {
    throw new NotFoundError('Status');
  }

  return successResponse(status);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.dynamicStatus.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Status');
    }

    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.dynamicStatus.findFirst({
        where: {
          ...mcWhere,
          entityType: existing.entityType,
          name: validatedData.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new ConflictError('Status name already exists for this entity type');
      }
    }

    if (validatedData.isDefault === true) {
      await prisma.dynamicStatus.updateMany({
        where: {
          ...mcWhere,
          entityType: existing.entityType,
          isDefault: true,
          id: { not: id },
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const status = await prisma.dynamicStatus.update({
      where: { id },
      data: validatedData,
    });

    return successResponse(status);
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
  const existing = await prisma.dynamicStatus.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Status');
  }

  await prisma.dynamicStatus.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, isDefault: false },
  });

  return successResponse({ message: 'Status deleted successfully' });
});
