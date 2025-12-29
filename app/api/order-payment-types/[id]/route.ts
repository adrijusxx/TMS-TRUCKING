import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';

const updateOrderPaymentTypeSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  terms: z.number().int().positive().nullable().optional(),
  requiresPO: z.boolean().optional(),
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
    let type;
    try {
      const mcWhere = await buildMcNumberIdWhereClause(session, request);
      type = await prisma.orderPaymentType.findFirst({
        where: {
          id,
          ...mcWhere,
          deletedAt: null,
        },
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        type = await prisma.orderPaymentType.findFirst({
          where: {
            id,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
      } else {
        throw error;
      }
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Order payment type not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    console.error('Order payment type fetch error:', error);
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
    const validatedData = updateOrderPaymentTypeSchema.parse(body);

    let mcWhere;
    let existing;
    try {
      mcWhere = await buildMcNumberIdWhereClause(session, request);
      existing = await prisma.orderPaymentType.findFirst({
        where: {
          id,
          ...mcWhere,
          deletedAt: null,
        },
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        mcWhere = { companyId: session.user.companyId };
        existing = await prisma.orderPaymentType.findFirst({
          where: {
            id,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
      } else {
        throw error;
      }
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Order payment type not found' } },
        { status: 404 }
      );
    }

    if (validatedData.isDefault === true) {
      try {
        await prisma.orderPaymentType.updateMany({
          where: {
            ...mcWhere,
            isDefault: true,
            id: { not: id },
            deletedAt: null,
          },
          data: { isDefault: false },
        });
      } catch (error: any) {
        // If mcNumberId column doesn't exist (P2022), fall back to companyId only
        if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
          await prisma.orderPaymentType.updateMany({
            where: {
              companyId: session.user.companyId,
              isDefault: true,
              id: { not: id },
              deletedAt: null,
            },
            data: { isDefault: false },
          });
        } else {
          throw error;
        }
      }
    }

    const type = await prisma.orderPaymentType.update({
      where: { id },
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
    console.error('Order payment type update error:', error);
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

    let existing;
    try {
      const mcWhere = await buildMcNumberIdWhereClause(session, request);
      existing = await prisma.orderPaymentType.findFirst({
        where: {
          id,
          ...mcWhere,
          deletedAt: null,
        },
      });
    } catch (error: any) {
      // If mcNumberId column doesn't exist (P2022), fall back to companyId only
      if (error?.code === 'P2022' && error?.meta?.column?.includes('mcNumberId')) {
        existing = await prisma.orderPaymentType.findFirst({
          where: {
            id,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
      } else {
        throw error;
      }
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Order payment type not found' } },
        { status: 404 }
      );
    }

    await prisma.orderPaymentType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, message: 'Order payment type deleted successfully' });
  } catch (error) {
    console.error('Order payment type delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
