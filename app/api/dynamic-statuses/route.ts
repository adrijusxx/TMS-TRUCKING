import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { EntityType } from '@prisma/client';

const createStatusSchema = z.object({
  entityType: z.nativeEnum(EntityType),
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  isDefault: z.boolean().optional(),
  workflowRules: z.any().optional(),
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
    const entityType = searchParams.get('entityType');

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const where: any = {
      ...mcWhere,
      deletedAt: null,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    const statuses = await prisma.dynamicStatus.findMany({
      where,
      orderBy: [{ entityType: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: statuses });
  } catch (error) {
    console.error('Dynamic statuses fetch error:', error);
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
    const validatedData = createStatusSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.dynamicStatus.findFirst({
      where: {
        ...mcWhere,
        entityType: validatedData.entityType,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Status already exists for this entity type' } },
        { status: 400 }
      );
    }

    if (validatedData.isDefault) {
      await prisma.dynamicStatus.updateMany({
        where: {
          ...mcWhere,
          entityType: validatedData.entityType,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const status = await prisma.dynamicStatus.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        order: validatedData.order ?? 0,
        isDefault: validatedData.isDefault ?? false,
      },
    });

    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Dynamic status create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
