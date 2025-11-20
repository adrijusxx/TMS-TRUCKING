import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { WorkOrderPriority } from '@prisma/client';

const updateWorkOrderTypeSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  defaultPriority: z.nativeEnum(WorkOrderPriority).optional(),
  estimatedHours: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const type = await prisma.workOrderType.findFirst({
      where: {
        id: id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!type) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Work order type not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    console.error('Work order type fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateWorkOrderTypeSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.workOrderType.findFirst({
      where: {
        id: id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Work order type not found' } },
        { status: 404 }
      );
    }

    const type = await prisma.workOrderType.update({
      where: { id: id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Work order type update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.workOrderType.findFirst({
      where: {
        id: id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Work order type not found' } },
        { status: 404 }
      );
    }

    await prisma.workOrderType.update({
      where: { id: id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Work order type deleted successfully' });
  } catch (error) {
    console.error('Work order type delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
