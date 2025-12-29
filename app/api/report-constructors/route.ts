import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { EntityType, ReportFormat, Prisma } from '@prisma/client';

const createReportConstructorSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  entityType: z.nativeEnum(EntityType),
  layout: z.any(),
  fields: z.any(),
  filters: z.any().optional(),
  grouping: z.any().optional(),
  sorting: z.any().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
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

    const constructors = await prisma.reportConstructor.findMany({
      where,
      orderBy: [{ entityType: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: constructors });
  } catch (error) {
    console.error('Report constructors fetch error:', error);
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
    const validatedData = createReportConstructorSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.reportConstructor.findFirst({
      where: {
        ...mcWhere,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Report constructor already exists' } },
        { status: 400 }
      );
    }

    const constructor = await prisma.reportConstructor.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        format: validatedData.format ?? ReportFormat.PDF,
        layout: typeof validatedData.layout === 'string' ? validatedData.layout : JSON.stringify(validatedData.layout),
        fields: typeof validatedData.fields === 'string' ? validatedData.fields : JSON.stringify(validatedData.fields),
        filters: validatedData.filters ? (typeof validatedData.filters === 'string' ? validatedData.filters : JSON.stringify(validatedData.filters)) : Prisma.JsonNull,
        grouping: validatedData.grouping ? (typeof validatedData.grouping === 'string' ? validatedData.grouping : JSON.stringify(validatedData.grouping)) : Prisma.JsonNull,
        sorting: validatedData.sorting ? (typeof validatedData.sorting === 'string' ? validatedData.sorting : JSON.stringify(validatedData.sorting)) : Prisma.JsonNull,
      },
    });

    return NextResponse.json({ success: true, data: constructor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Report constructor create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
