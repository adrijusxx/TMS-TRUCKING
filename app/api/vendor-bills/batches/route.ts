import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { VendorBillManager } from '@/lib/managers/VendorBillManager';
import { handleApiError } from '@/lib/api/route-helpers';

const createBatchSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  mcNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mcNumber = searchParams.get('mcNumber');

    const where: any = { companyId: session.user.companyId };
    if (mcNumber) where.mcNumber = mcNumber;

    const batches = await prisma.vendorBillBatch.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { bills: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createBatchSchema.parse(body);

    const batch = await VendorBillManager.createBatch(
      session.user.companyId,
      new Date(validated.periodStart),
      new Date(validated.periodEnd),
      session.user.id,
      validated.mcNumber
    );

    return NextResponse.json({ success: true, data: batch }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
