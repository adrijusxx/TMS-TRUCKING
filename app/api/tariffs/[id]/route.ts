import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { TariffType } from '@prisma/client';

const updateTariffSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(TariffType).optional(),
  rate: z.number().positive().optional(),
  minimumRate: z.number().optional(),
  perStop: z.number().optional(),
  perPound: z.number().optional(),
  perMile: z.number().optional(),
  fuelSurcharge: z.number().optional(),
  effectiveDate: z.string().datetime().nullable().optional(),
  expiryDate: z.string().datetime().nullable().optional(),
  isDefault: z.boolean().optional(),
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
    const tariff = await prisma.tariff.findFirst({
      where: {
        id: id,
        ...mcWhere,
        deletedAt: null,
      },
      include: { tariffRules: true },
    });

    if (!tariff) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tariff not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tariff });
  } catch (error) {
    console.error('Tariff fetch error:', error);
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
    const validatedData = updateTariffSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.tariff.findFirst({
      where: {
        id: id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tariff not found' } },
        { status: 404 }
      );
    }

    if (validatedData.isDefault === true) {
      await prisma.tariff.updateMany({
        where: {
          ...mcWhere,
          isDefault: true,
          id: { not: id },
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.effectiveDate !== undefined) {
      updateData.effectiveDate = validatedData.effectiveDate ? new Date(validatedData.effectiveDate) : null;
    }
    if (validatedData.expiryDate !== undefined) {
      updateData.expiryDate = validatedData.expiryDate ? new Date(validatedData.expiryDate) : null;
    }

    const tariff = await prisma.tariff.update({
      where: { id: id },
      data: updateData,
      include: { tariffRules: true },
    });

    return NextResponse.json({ success: true, data: tariff });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Tariff update error:', error);
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
    const existing = await prisma.tariff.findFirst({
      where: {
        id: id,
        ...mcWhere,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tariff not found' } },
        { status: 404 }
      );
    }

    await prisma.tariff.update({
      where: { id: id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, message: 'Tariff deleted successfully' });
  } catch (error) {
    console.error('Tariff delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
