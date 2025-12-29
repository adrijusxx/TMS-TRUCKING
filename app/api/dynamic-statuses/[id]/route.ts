import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { EntityType } from '@prisma/client';

const updateStatusSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  isDefault: z.boolean().optional(),
  workflowRules: z.any().optional(),
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

    const status = await prisma.dynamicStatus.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!status) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Status not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error('Dynamic status fetch error:', error);
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
    const validatedData = updateStatusSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.dynamicStatus.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Status not found' } },
        { status: 404 }
      );
    }

    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.dynamicStatus.findFirst({
        where: {
          ...mcWhere,
          entityType: existing.entityType,
          name: validatedData.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Status name already exists for this entity type' } },
          { status: 400 }
        );
      }
    }

    if (validatedData.isDefault === true) {
      await prisma.dynamicStatus.updateMany({
        where: {
          ...mcWhere,
          entityType: existing.entityType,
          isDefault: true,
          id: { not: id },
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const status = await prisma.dynamicStatus.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Dynamic status update error:', error);
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
    const existing = await prisma.dynamicStatus.findFirst({
      where: {
        id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Status not found' } },
        { status: 404 }
      );
    }

    await prisma.dynamicStatus.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, message: 'Status deleted successfully' });
  } catch (error) {
    console.error('Dynamic status delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
