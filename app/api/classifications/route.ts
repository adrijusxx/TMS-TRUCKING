import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { ClassificationType } from '@prisma/client';

const createClassificationSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  type: z.nativeEnum(ClassificationType),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().optional(),
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
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const where: any = {
      ...mcWhere,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }
    if (parentId) {
      where.parentId = parentId;
    } else if (parentId === '') {
      where.parentId = null;
    }

    const classifications = await prisma.classification.findMany({
      where,
      include: { parent: true, children: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: classifications });
  } catch (error) {
    console.error('Classifications fetch error:', error);
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
    const validatedData = createClassificationSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.classification.findFirst({
      where: {
        ...mcWhere,
        type: validatedData.type,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Classification already exists for this type' } },
        { status: 400 }
      );
    }

    const classification = await prisma.classification.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        order: validatedData.order ?? 0,
      },
      include: { parent: true, children: true },
    });

    return NextResponse.json({ success: true, data: classification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Classification create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
