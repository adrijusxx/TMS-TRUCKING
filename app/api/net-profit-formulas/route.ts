import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createFormulaSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  formula: z.string().min(1),
  variables: z.any().optional(),
  isDefault: z.boolean().optional(),
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

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const formulas = await prisma.netProfitFormula.findMany({
      where: {
        ...mcWhere,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: formulas });
  } catch (error) {
    console.error('Net profit formulas fetch error:', error);
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
    const validatedData = createFormulaSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.netProfitFormula.findFirst({
      where: {
        ...mcWhere,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Formula already exists' } },
        { status: 400 }
      );
    }

    if (validatedData.isDefault) {
      await prisma.netProfitFormula.updateMany({
        where: {
          ...mcWhere,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const formula = await prisma.netProfitFormula.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        variables: validatedData.variables ? JSON.stringify(validatedData.variables) : Prisma.JsonNull,
        isDefault: validatedData.isDefault ?? false,
      },
    });

    return NextResponse.json({ success: true, data: formula });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Net profit formula create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
