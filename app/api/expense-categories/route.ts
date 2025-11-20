import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    let categories;
    try {
      const mcWhere = await buildMcNumberIdWhereClause(session, request);
      categories = await prisma.expenseCategory.findMany({
        where: {
          ...mcWhere,
          deletedAt: null,
        },
        include: { parent: true, children: true },
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        categories = await prisma.expenseCategory.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
          include: { parent: true, children: true },
          orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Expense categories fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    let mcWhere;
    try {
      mcWhere = await buildMcNumberIdWhereClause(session, request);
    } catch (error: any) {
      // If mcNumberId column doesn't exist, use companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        mcWhere = { companyId: session.user.companyId };
      } else {
        throw error;
      }
    }

    try {
      const existing = await prisma.expenseCategory.findFirst({
        where: {
          ...mcWhere,
          name: validatedData.name,
          deletedAt: null,
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Category already exists' } },
          { status: 400 }
        );
      }

      const category = await prisma.expenseCategory.create({
        data: {
          ...validatedData,
          companyId: session.user.companyId,
          mcNumberId: mcWhere?.mcNumberId || null,
        },
      });

      return NextResponse.json({ success: true, data: category });
    } catch (dbError: any) {
      // If mcNumberId column doesn't exist, retry without it
      if (dbError?.code === 'P2022' && dbError?.meta?.column?.includes('mcNumberId')) {
        const existing = await prisma.expenseCategory.findFirst({
          where: {
            companyId: session.user.companyId,
            name: validatedData.name,
            deletedAt: null,
          },
        });

        if (existing) {
          return NextResponse.json(
            { success: false, error: { code: 'DUPLICATE', message: 'Category already exists' } },
            { status: 400 }
          );
        }

        const category = await prisma.expenseCategory.create({
          data: {
            ...validatedData,
            companyId: session.user.companyId,
          },
        });

        return NextResponse.json({ success: true, data: category });
      }
      throw dbError;
    }

    // This should never be reached, but TypeScript needs it
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create expense category' } },
      { status: 500 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Expense category create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
