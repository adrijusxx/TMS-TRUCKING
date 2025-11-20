import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Expense type not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: expenseType });
  } catch (error) {
    console.error('Expense type fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Expense type not found' } },
        { status: 404 }
      );
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
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Expense type name already exists' } },
          { status: 400 }
        );
      }
    }

    const expenseType = await prisma.expenseType.update({
      where: { id },
      data: validatedData,
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: expenseType });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Expense type update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Expense type not found' } },
        { status: 404 }
      );
    }

    await prisma.expenseType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Expense type deleted successfully' });
  } catch (error) {
    console.error('Expense type delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
