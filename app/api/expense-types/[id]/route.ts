import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

const updateExpenseTypeSchema = z.object({
  categoryId: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  defaultAmount: z.number().optional(),
  isReimbursable: z.boolean().optional(),
  requiresReceipt: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const mcWhere = await buildMcNumberIdWhereClause(session, request);

  const expenseType = await prisma.expenseType.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
    include: { category: true },
  });

  if (!expenseType) {
    throw new NotFoundError('Expense type');
  }

  return successResponse(expenseType);
});

export const PATCH = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateExpenseTypeSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.expenseType.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Expense type');
    }

    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.expenseType.findFirst({
        where: {
          ...mcWhere,
          name: validatedData.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new ConflictError('Expense type name already exists');
      }
    }

    const expenseType = await prisma.expenseType.update({
      where: { id },
      data: validatedData,
      include: { category: true },
    });

    return successResponse(expenseType);
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
  const existing = await prisma.expenseType.findFirst({
    where: {
      id,
      ...mcWhere,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new NotFoundError('Expense type');
  }

  await prisma.expenseType.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return successResponse({ message: 'Expense type deleted successfully' });
});
