import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
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
    let category;
    try {
      const mcWhere = await buildMcNumberIdWhereClause(session, request);
      category = await prisma.expenseCategory.findFirst({
        where: {
          id,
          ...mcWhere,
          deletedAt: null,
        },
        include: { parent: true, children: true },
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        category = await prisma.expenseCategory.findFirst({
          where: {
            id,
            companyId: session.user.companyId,
            deletedAt: null,
          },
          include: { parent: true, children: true },
        });
      } else {
        throw error;
      }
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Expense category fetch error:', error);
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
    const validatedData = updateCategorySchema.parse(body);

    let mcWhere;
    let existing;
    try {
      mcWhere = await buildMcNumberIdWhereClause(session, request);
      existing = await prisma.expenseCategory.findFirst({
        where: {
          id,
          ...mcWhere,
          deletedAt: null,
        },
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        mcWhere = { companyId: session.user.companyId };
        existing = await prisma.expenseCategory.findFirst({
          where: {
            id,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
      } else {
        throw error;
      }
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    if (validatedData.name && validatedData.name !== existing.name) {
      let duplicate;
      try {
        duplicate = await prisma.expenseCategory.findFirst({
          where: {
            ...mcWhere,
            name: validatedData.name,
            id: { not: id },
            deletedAt: null,
          },
        });
      } catch (error: any) {
        // If mcNumberId column doesn't exist (P2022), fall back to companyId only
        if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
          duplicate = await prisma.expenseCategory.findFirst({
            where: {
              companyId: session.user.companyId,
              name: validatedData.name,
              id: { not: id },
              deletedAt: null,
            },
          });
        } else {
          throw error;
        }
      }

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Category name already exists' } },
          { status: 400 }
        );
      }
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Expense category update error:', error);
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

    let existing;
    try {
      const mcWhere = await buildMcNumberIdWhereClause(session, request);
      existing = await prisma.expenseCategory.findFirst({
        where: {
          id,
          ...mcWhere,
          deletedAt: null,
        },
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        existing = await prisma.expenseCategory.findFirst({
          where: {
            id,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
      } else {
        throw error;
      }
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    await prisma.expenseCategory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Expense category delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
