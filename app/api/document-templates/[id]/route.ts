import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { DocumentType } from '@prisma/client';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  variables: z.any().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const mcWhere = await buildMcNumberIdWhereClause(session, request);

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!template) {
    throw new NotFoundError('Template');
  }

  return successResponse(template);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Template');
    }

    if (validatedData.isDefault === true) {
      await prisma.documentTemplate.updateMany({
        where: {
          ...mcWhere,
          type: existing.type,
          isDefault: true,
          id: { not: id },
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.variables !== undefined) {
      updateData.variables = validatedData.variables ? JSON.stringify(validatedData.variables) : null;
    }

    const template = await prisma.documentTemplate.update({
      where: { id },
      data: updateData,
    });

    return successResponse(template);
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
  const existing = await prisma.documentTemplate.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Template');
  }

  await prisma.documentTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, isDefault: false },
  });

  return successResponse({ message: 'Template deleted successfully' });
});
