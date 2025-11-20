import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { TariffType } from '@prisma/client';

const createTariffSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(TariffType),
  rate: z.number().positive(),
  minimumRate: z.number().optional(),
  perStop: z.number().optional(),
  perPound: z.number().optional(),
  perMile: z.number().optional(),
  fuelSurcharge: z.number().optional(),
  effectiveDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
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

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const tariffs = await prisma.tariff.findMany({
      where: {
        ...mcWhere,
        deletedAt: null,
      },
      include: { tariffRules: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: tariffs });
  } catch (error) {
    console.error('Tariffs fetch error:', error);
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
    const validatedData = createTariffSchema.parse(body);

    const mcWhere = await buildMcNumberIdWhereClause(session, request);
    const existing = await prisma.tariff.findFirst({
      where: {
        ...mcWhere,
        name: validatedData.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Tariff already exists' } },
        { status: 400 }
      );
    }

    if (validatedData.isDefault) {
      await prisma.tariff.updateMany({
        where: {
          ...mcWhere,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const tariff = await prisma.tariff.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        mcNumberId: mcWhere.mcNumberId || null,
        effectiveDate: validatedData.effectiveDate ? new Date(validatedData.effectiveDate) : null,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        isDefault: validatedData.isDefault ?? false,
      },
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
    console.error('Tariff create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
