import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { resolveEntityParam } from '@/lib/utils/entity-resolver';
import { z } from 'zod';

const updateBatchSchema = z.object({
  postStatus: z.enum(['UNPOSTED', 'POSTED', 'PAID']).optional(),
  mcNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolved = await resolveEntityParam('invoice-batches', id, session.user.companyId);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entity not found' } },
        { status: 404 }
      );
    }

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id: resolved.id,
        companyId: session.user.companyId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: { id: true, name: true, customerNumber: true },
                },
                load: {
                  select: {
                    id: true,
                    loadNumber: true,
                    shipmentId: true,
                    driverPay: true,
                    pickupDate: true,
                    deliveryDate: true,
                    deliveredAt: true,
                    podUploadedAt: true,
                    status: true,
                    tripId: true,
                    driver: {
                      select: {
                        user: { select: { firstName: true, lastName: true } },
                      },
                    },
                    truck: {
                      select: { truckNumber: true },
                    },
                    rateConfirmation: {
                      select: {
                        document: {
                          select: { fileUrl: true },
                        },
                      },
                    },
                    documents: {
                      where: { type: { in: ['POD', 'RATE_CONFIRMATION'] }, deletedAt: null },
                      select: { id: true, fileUrl: true, type: true },
                    },
                  },
                },
                factoringCompany: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    // For invoices where load relation is null but loadIds array has entries,
    // fetch the first load from loadIds so the table can display load data
    const missingLoadIds: string[] = [];
    for (const item of batch.items) {
      if (!item.invoice.load && Array.isArray(item.invoice.loadIds) && item.invoice.loadIds.length > 0) {
        missingLoadIds.push(item.invoice.loadIds[0]);
      }
    }

    if (missingLoadIds.length > 0) {
      const loads = await prisma.load.findMany({
        where: { id: { in: missingLoadIds } },
        select: {
          id: true,
          loadNumber: true,
          shipmentId: true,
          driverPay: true,
          pickupDate: true,
          deliveryDate: true,
          deliveredAt: true,
          podUploadedAt: true,
          status: true,
          tripId: true,
          driver: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          truck: {
            select: { truckNumber: true },
          },
          rateConfirmation: {
            select: {
              document: {
                select: { fileUrl: true },
              },
            },
          },
          documents: {
            where: { type: { in: ['POD', 'RATE_CONFIRMATION'] }, deletedAt: null },
            select: { id: true, fileUrl: true, type: true },
          },
        },
      });

      const loadMap = new Map(loads.map((l) => [l.id, l]));
      for (const item of batch.items) {
        if (!item.invoice.load && Array.isArray(item.invoice.loadIds) && item.invoice.loadIds.length > 0) {
          const foundLoad = loadMap.get(item.invoice.loadIds[0]);
          if (foundLoad) {
            (item.invoice as any).load = foundLoad;
          }
        }
      }
    }

    const invoiceCount = batch.items.length;
    const calculatedTotal = batch.items.reduce(
      (sum, item) => sum + (item.invoice.total || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...batch,
        invoiceCount,
        totalAmount: calculatedTotal,
      },
    });
  } catch (error) {
    console.error('Get batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolved = await resolveEntityParam('invoice-batches', id, session.user.companyId);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entity not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateBatchSchema.parse(body);

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id: resolved.id,
        companyId: session.user.companyId,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    const updated = await prisma.invoiceBatch.update({
      where: { id: resolved.id },
      data: {
        ...(validated.postStatus && { postStatus: validated.postStatus }),
        ...(validated.mcNumber !== undefined && { mcNumber: validated.mcNumber }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        invoiceCount: updated.items.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Update batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to delete batches
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete batches',
          },
        },
        { status: 403 }
      );
    }

    const resolved = await resolveEntityParam('invoice-batches', id, session.user.companyId);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entity not found' } },
        { status: 404 }
      );
    }

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id: resolved.id,
        companyId: session.user.companyId,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    // Posted/Paid batches require batches.delete_posted permission
    if (batch.postStatus !== 'UNPOSTED') {
      if (!hasPermission(role, 'batches.delete_posted')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to delete posted batches',
            },
          },
          { status: 403 }
        );
      }
    }

    await prisma.invoiceBatch.delete({
      where: { id: resolved.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

