import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const updateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  formula: z.string().min(1).optional(),
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

  const formula = await prisma.netProfitFormula.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!formula) {
    throw new NotFoundError('Formula');
  }

  return successResponse(formula);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateFormulaSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.netProfitFormula.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Formula');
    }

    if (validatedData.isDefault === true) {
      await prisma.netProfitFormula.updateMany({
        where: {
          ...mcWhere,
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

    const formula = await prisma.netProfitFormula.update({
      where: { id },
      data: updateData,
    });

    return successResponse(formula);
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
  const existing = await prisma.netProfitFormula.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Formula');
  }

  await prisma.netProfitFormula.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, isDefault: false },
  });

  return successResponse({ message: 'Formula deleted successfully' });
});
