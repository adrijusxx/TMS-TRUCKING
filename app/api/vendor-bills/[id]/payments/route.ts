import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { VendorBillManager } from '@/lib/managers/VendorBillManager';
import { handleApiError } from '@/lib/api/route-helpers';

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().datetime(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const payments = await prisma.vendorPayment.findMany({
      where: { vendorBillId: id, companyId: session.user.companyId },
      orderBy: { paymentDate: 'desc' },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = recordPaymentSchema.parse(body);

    const bill = await VendorBillManager.recordPayment(
      id,
      session.user.companyId,
      {
        amount: validated.amount,
        paymentDate: new Date(validated.paymentDate),
        paymentMethod: validated.paymentMethod as any,
        referenceNumber: validated.referenceNumber,
        notes: validated.notes,
        createdById: session.user.id,
      }
    );

    return NextResponse.json({ success: true, data: bill }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
