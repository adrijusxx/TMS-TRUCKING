import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';

const updateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  formula: z.string().min(1).optional(),
  variables: z.any().optional(),
  isDefault: z.boolean().optional(),
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

    const formula = await prisma.netProfitFormula.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!formula) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Formula not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: formula });
  } catch (error) {
    console.error('Net profit formula fetch error:', error);
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
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Formula not found' } },
        { status: 404 }
      );
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

    return NextResponse.json({ success: true, data: formula });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Net profit formula update error:', error);
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
    const existing = await prisma.netProfitFormula.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Formula not found' } },
        { status: 404 }
      );
    }

    await prisma.netProfitFormula.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, message: 'Formula deleted successfully' });
  } catch (error) {
    console.error('Net profit formula delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
