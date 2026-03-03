import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ReportFormat } from '@prisma/client';

const updateReportConstructorSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  layout: z.any().optional(),
  fields: z.any().optional(),
  filters: z.any().optional(),
  grouping: z.any().optional(),
  sorting: z.any().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const mcWhere = await buildMcNumberIdWhereClause(session, request);

  const constructor = await prisma.reportConstructor.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!constructor) {
    throw new NotFoundError('Report constructor');
  }

  return successResponse(constructor);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReportConstructorSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.reportConstructor.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Report constructor');
    }

    const updateData: any = { ...validatedData };
    if (validatedData.layout !== undefined) {
      updateData.layout = typeof validatedData.layout === 'string'
        ? validatedData.layout
        : JSON.stringify(validatedData.layout);
    }
    if (validatedData.fields !== undefined) {
      updateData.fields = typeof validatedData.fields === 'string'
        ? validatedData.fields
        : JSON.stringify(validatedData.fields);
    }
    if (validatedData.filters !== undefined) {
      updateData.filters = validatedData.filters
        ? (typeof validatedData.filters === 'string' ? validatedData.filters : JSON.stringify(validatedData.filters))
        : null;
    }
    if (validatedData.grouping !== undefined) {
      updateData.grouping = validatedData.grouping
        ? (typeof validatedData.grouping === 'string' ? validatedData.grouping : JSON.stringify(validatedData.grouping))
        : null;
    }
    if (validatedData.sorting !== undefined) {
      updateData.sorting = validatedData.sorting
        ? (typeof validatedData.sorting === 'string' ? validatedData.sorting : JSON.stringify(validatedData.sorting))
        : null;
    }

    const constructor = await prisma.reportConstructor.update({
      where: { id },
      data: updateData,
    });

    return successResponse(constructor);
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
  const existing = await prisma.reportConstructor.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Report constructor');
  }

  await prisma.reportConstructor.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return successResponse({ message: 'Report constructor deleted successfully' });
});
