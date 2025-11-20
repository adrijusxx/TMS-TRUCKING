import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOrderPaymentTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  terms: z.number().int().positive().optional(),
  requiresPO: z.boolean().optional(),
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

    const types = await prisma.orderPaymentType.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('Order payment types fetch error:', error);
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
    const validatedData = createOrderPaymentTypeSchema.parse(body);

    const existing = await prisma.orderPaymentType.findFirst({
      where: {
        companyId: session.user.companyId,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Order payment type already exists' } },
        { status: 400 }
      );
    }

    if (validatedData.isDefault) {
      await prisma.orderPaymentType.updateMany({
        where: {
          companyId: session.user.companyId,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const type = await prisma.orderPaymentType.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        requiresPO: validatedData.requiresPO ?? false,
        isDefault: validatedData.isDefault ?? false,
      },
    });

    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Order payment type create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
