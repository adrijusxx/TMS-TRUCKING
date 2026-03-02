import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { handleApiError } from '@/lib/api/route-helpers';

const createScheduledSchema = z.object({
  vendorId: z.string(),
  description: z.string(),
  amount: z.number().positive(),
  frequency: z.enum(['PER_SETTLEMENT', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_TIME']),
  dayOfWeek: z.number().min(1).max(7).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduled = await prisma.vendorScheduledPayment.findMany({
      where: { companyId: session.user.companyId },
      include: {
        vendor: { select: { id: true, name: true, vendorNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: scheduled });
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
    const validated = createScheduledSchema.parse(body);

    const scheduled = await prisma.vendorScheduledPayment.create({
      data: {
        companyId: session.user.companyId,
        vendorId: validated.vendorId,
        description: validated.description,
        amount: validated.amount,
        frequency: validated.frequency,
        dayOfWeek: validated.dayOfWeek,
        dayOfMonth: validated.dayOfMonth,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
        nextPaymentDate: new Date(validated.startDate),
        createdById: session.user.id,
      },
      include: { vendor: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: scheduled }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
