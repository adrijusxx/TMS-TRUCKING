import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/route-helpers';

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
    const bill = await prisma.vendorBill.findFirst({
      where: { id, companyId: session.user.companyId },
      include: {
        vendor: true,
        load: { select: { id: true, loadNumber: true } },
        truck: { select: { id: true, truckNumber: true } },
        batch: { select: { id: true, batchNumber: true, postStatus: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
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

    const bill = await prisma.vendorBill.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const updated = await prisma.vendorBill.update({
      where: { id },
      data: {
        vendorInvoiceNumber: body.vendorInvoiceNumber ?? bill.vendorInvoiceNumber,
        description: body.description ?? bill.description,
        notes: body.notes ?? bill.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : bill.dueDate,
        status: body.status ?? bill.status,
      },
      include: { vendor: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bill = await prisma.vendorBill.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    if (bill.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot delete a paid bill' }, { status: 400 });
    }

    await prisma.vendorBill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
