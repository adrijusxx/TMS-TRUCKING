import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/drivers/[id]/payments
 * Get all payments related to a driver's activities
 * Includes payments from fuel entries, breakdowns, and loads (invoices)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'drivers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // FUEL, BREAKDOWN, INVOICE, or all
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mcNumberId = searchParams.get('mcNumberId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get payments from fuel entries
    const fuelPayments = await prisma.payment.findMany({
      where: {
        type: 'FUEL',
        fuelEntry: {
          driverId: id,
          truck: {
            companyId: session.user.companyId,
          },
          ...(mcNumberId && { mcNumberId }),
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
      },
      include: {
        fuelEntry: {
          select: {
            id: true,
            date: true,
            totalCost: true,
            location: true,
            truck: {
              select: {
                truckNumber: true,
              },
            },
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Get payments from breakdowns
    const breakdownPayments = await prisma.payment.findMany({
      where: {
        type: 'BREAKDOWN',
        breakdown: {
          driverId: id,
          companyId: session.user.companyId,
          deletedAt: null,
          ...(mcNumberId && { mcNumberId }),
          ...(Object.keys(dateFilter).length > 0 && { reportedAt: dateFilter }),
        },
      },
      include: {
        breakdown: {
          select: {
            id: true,
            breakdownNumber: true,
            totalCost: true,
            location: true,
            reportedAt: true,
            truck: {
              select: {
                truckNumber: true,
              },
            },
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Get payments from invoices (loads assigned to driver)
    // First, find all loads for this driver
    const driverLoads = await prisma.load.findMany({
      where: {
        driverId: id,
        companyId: session.user.companyId,
        deletedAt: null,
        ...(Object.keys(dateFilter).length > 0 && { deliveryDate: dateFilter }),
      },
      select: {
        id: true,
        loadNumber: true,
      },
    });

    const driverLoadIds = driverLoads.map((l) => l.id);

    // Get invoices that contain any of the driver's loads
    const invoicePayments = driverLoadIds.length > 0
      ? await prisma.payment.findMany({
          where: {
            type: 'INVOICE',
            invoice: {
              loadIds: {
                hasSome: driverLoadIds, // Invoice contains at least one of the driver's loads
              },
              customer: {
                companyId: session.user.companyId,
              },
              ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter }),
            },
            ...(mcNumberId && { mcNumberId }),
          },
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                total: true,
                invoiceDate: true,
                loadIds: true, // Include loadIds to filter driver's loads
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            mcNumber: {
              select: {
                id: true,
                number: true,
                companyName: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { paymentDate: 'desc' },
        })
      : [];

    // Filter invoice loads to only show driver's loads and fetch load details
    const invoicePaymentsWithLoads = await Promise.all(
      invoicePayments.map(async (payment) => {
        if (payment.invoice && payment.invoice.loadIds) {
          const driverLoadsInInvoice = payment.invoice.loadIds.filter((loadId) =>
            driverLoadIds.includes(loadId)
          );

          if (driverLoadsInInvoice.length > 0) {
            const loads = await prisma.load.findMany({
              where: {
                id: { in: driverLoadsInInvoice },
              },
              select: {
                id: true,
                loadNumber: true,
              },
            });

            return {
              ...payment,
              invoice: {
                ...payment.invoice,
                loads: loads.slice(0, 5), // Limit to 5 loads for display
              },
            };
          }
        }
        return payment;
      })
    );

    // Combine all payments
    let allPayments: any[] = [];

    if (!type || type === 'FUEL') {
      allPayments = [...allPayments, ...fuelPayments.map(p => ({ ...p, activityType: 'FUEL' }))];
    }
    if (!type || type === 'BREAKDOWN') {
      allPayments = [...allPayments, ...breakdownPayments.map(p => ({ ...p, activityType: 'BREAKDOWN' }))];
    }
    if (!type || type === 'INVOICE') {
      allPayments = [...allPayments, ...invoicePaymentsWithLoads.map(p => ({ ...p, activityType: 'INVOICE' }))];
    }

    // Sort by payment date (descending)
    allPayments.sort((a, b) => {
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: allPayments,
      meta: {
        total: allPayments.length,
        fuelCount: fuelPayments.length,
        breakdownCount: breakdownPayments.length,
        invoiceCount: invoicePayments.length,
      },
    });
  } catch (error) {
    console.error('Driver payments fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch driver payments',
        },
      },
      { status: 500 }
    );
  }
}

