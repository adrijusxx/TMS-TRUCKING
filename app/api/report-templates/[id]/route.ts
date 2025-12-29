import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { ReportFormat } from '@prisma/client';

const updateReportTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  template: z.any().optional(),
  fields: z.any().optional(),
  filters: z.any().optional(),
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

    const template = await prisma.reportTemplate.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report template not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Report template fetch error:', error);
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
    const validatedData = updateReportTemplateSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.reportTemplate.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report template not found' } },
        { status: 404 }
      );
    }

    if (validatedData.isDefault === true) {
      await prisma.reportTemplate.updateMany({
        where: {
          ...mcWhere,
          type: existing.type,
          isDefault: true,
          id: { not: id },
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.template !== undefined) {
      updateData.template = typeof validatedData.template === 'string' 
        ? validatedData.template 
        : JSON.stringify(validatedData.template);
    }
    if (validatedData.fields !== undefined) {
      updateData.fields = validatedData.fields ? JSON.stringify(validatedData.fields) : null;
    }
    if (validatedData.filters !== undefined) {
      updateData.filters = validatedData.filters ? JSON.stringify(validatedData.filters) : null;
    }

    const template = await prisma.reportTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Report template update error:', error);
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
    const existing = await prisma.reportTemplate.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report template not found' } },
        { status: 404 }
      );
    }

    await prisma.reportTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, message: 'Report template deleted successfully' });
  } catch (error) {
    console.error('Report template delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
