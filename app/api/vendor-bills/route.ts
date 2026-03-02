import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { VendorBillManager } from '@/lib/managers/VendorBillManager';
import { handleApiError } from '@/lib/api/route-helpers';

const createBillSchema = z.object({
  vendorId: z.string(),
  vendorInvoiceNumber: z.string().optional(),
  amount: z.number().positive(),
  billDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  loadId: z.string().optional(),
  truckId: z.string().optional(),
  mcNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const mcNumber = searchParams.get('mcNumber');

    const where: any = { companyId: session.user.companyId };
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (mcNumber) where.mcNumber = mcNumber;

    const [bills, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, vendorNumber: true } },
          load: { select: { id: true, loadNumber: true } },
          truck: { select: { id: true, truckNumber: true } },
          batch: { select: { id: true, batchNumber: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendorBill.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: bills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
    const validated = createBillSchema.parse(body);

    const bill = await VendorBillManager.createBill({
      companyId: session.user.companyId,
      vendorId: validated.vendorId,
      vendorInvoiceNumber: validated.vendorInvoiceNumber,
      amount: validated.amount,
      billDate: new Date(validated.billDate),
      dueDate: new Date(validated.dueDate),
      periodStart: validated.periodStart ? new Date(validated.periodStart) : undefined,
      periodEnd: validated.periodEnd ? new Date(validated.periodEnd) : undefined,
      description: validated.description,
      notes: validated.notes,
      loadId: validated.loadId,
      truckId: validated.truckId,
      mcNumber: validated.mcNumber,
      createdById: session.user.id,
    });

    return NextResponse.json({ success: true, data: bill }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
