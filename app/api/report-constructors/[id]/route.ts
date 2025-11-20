import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { ReportFormat } from '@prisma/client';

const updateReportConstructorSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  layout: z.any().optional(),
  fields: z.any().optional(),
  filters: z.any().optional(),
  grouping: z.any().optional(),
  sorting: z.any().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
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

    const constructor = await prisma.reportConstructor.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!constructor) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report constructor not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: constructor });
  } catch (error) {
    console.error('Report constructor fetch error:', error);
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
    const validatedData = updateReportConstructorSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.reportConstructor.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report constructor not found' } },
        { status: 404 }
      );
    }

    const updateData: any = { ...validatedData };
    if (validatedData.layout !== undefined) {
      updateData.layout = typeof validatedData.layout === 'string' 
        ? validatedData.layout 
        : JSON.stringify(validatedData.layout);
    }
    if (validatedData.fields !== undefined) {
      updateData.fields = typeof validatedData.fields === 'string' 
        ? validatedData.fields 
        : JSON.stringify(validatedData.fields);
    }
    if (validatedData.filters !== undefined) {
      updateData.filters = validatedData.filters ? (typeof validatedData.filters === 'string' ? validatedData.filters : JSON.stringify(validatedData.filters)) : null;
    }
    if (validatedData.grouping !== undefined) {
      updateData.grouping = validatedData.grouping ? (typeof validatedData.grouping === 'string' ? validatedData.grouping : JSON.stringify(validatedData.grouping)) : null;
    }
    if (validatedData.sorting !== undefined) {
      updateData.sorting = validatedData.sorting ? (typeof validatedData.sorting === 'string' ? validatedData.sorting : JSON.stringify(validatedData.sorting)) : null;
    }

    const constructor = await prisma.reportConstructor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: constructor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Report constructor update error:', error);
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
    const existing = await prisma.reportConstructor.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report constructor not found' } },
        { status: 404 }
      );
    }

    await prisma.reportConstructor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Report constructor deleted successfully' });
  } catch (error) {
    console.error('Report constructor delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
