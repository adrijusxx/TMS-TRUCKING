import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { VendorBillManager } from '@/lib/managers/VendorBillManager';
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
    const batch = await prisma.vendorBillBatch.findFirst({
      where: { id, companyId: session.user.companyId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        bills: {
          include: {
            vendor: { select: { id: true, name: true, vendorNumber: true } },
            load: { select: { id: true, loadNumber: true } },
            truck: { select: { id: true, truckNumber: true } },
            _count: { select: { payments: true } },
          },
          orderBy: { billDate: 'desc' },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: batch });
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

    // Support status change (post/unpost)
    if (body.postStatus === 'POSTED') {
      const batch = await VendorBillManager.postBatch(id);
      return NextResponse.json({ success: true, data: batch });
    }

    const updated = await prisma.vendorBillBatch.update({
      where: { id },
      data: {
        notes: body.notes,
        postStatus: body.postStatus,
        paidAt: body.postStatus === 'PAID' ? new Date() : undefined,
      },
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
    const batch = await prisma.vendorBillBatch.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (batch.postStatus !== 'UNPOSTED') {
      return NextResponse.json({ error: 'Can only delete unposted batches' }, { status: 400 });
    }

    // Unlink bills, then delete batch
    await prisma.vendorBill.updateMany({
      where: { batchId: id },
      data: { batchId: null },
    });
    await prisma.vendorBillBatch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
