import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';

const createSafetyConfigSchema = z.object({
  category: z.string().min(1),
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional(),
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

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const where: any = {
      ...mcWhere,
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    const configs = await prisma.safetyConfiguration.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error('Safety configurations fetch error:', error);
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
    const validatedData = createSafetyConfigSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.safetyConfiguration.findFirst({
      where: {
        ...mcWhere,
        category: validatedData.category,
        key: validatedData.key,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Safety configuration already exists' } },
        { status: 400 }
      );
    }

    const config = await prisma.safetyConfiguration.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        value: typeof validatedData.value === 'string' ? validatedData.value : JSON.stringify(validatedData.value),
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Safety configuration create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
