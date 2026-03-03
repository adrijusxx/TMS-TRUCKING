import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ReportFormat } from '@prisma/client';

const updateReportTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  template: z.any().optional(),
  fields: z.any().optional(),
  filters: z.any().optional(),
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

  const template = await prisma.reportTemplate.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!template) {
    throw new NotFoundError('Report template');
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
    const validatedData = updateReportTemplateSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.reportTemplate.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Report template');
    }

    if (validatedData.isDefault === true) {
      await prisma.reportTemplate.updateMany({
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
    if (validatedData.template !== undefined) {
      updateData.template = typeof validatedData.template === 'string'
        ? validatedData.template
        : JSON.stringify(validatedData.template);
    }
    if (validatedData.fields !== undefined) {
      updateData.fields = validatedData.fields ? JSON.stringify(validatedData.fields) : null;
    }
    if (validatedData.filters !== undefined) {
      updateData.filters = validatedData.filters ? JSON.stringify(validatedData.filters) : null;
    }

    const template = await prisma.reportTemplate.update({
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
  const existing = await prisma.reportTemplate.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Report template');
  }

  await prisma.reportTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, isDefault: false },
  });

  return successResponse({ message: 'Report template deleted successfully' });
});
