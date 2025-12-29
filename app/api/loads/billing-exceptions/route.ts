import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { LoadStatus } from '@prisma/client';

/**
 * GET /api/loads/billing-exceptions
 * Fetch loads with billing exceptions (isBillingHold === true OR status === 'READY_TO_BILL')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Build MC filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // Fetch loads with billing exceptions
    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deletedAt: null,
        OR: [
          { isBillingHold: true },
          { status: LoadStatus.READY_TO_BILL },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
        documents: {
          where: {
            type: 'POD',
            deletedAt: null,
          },
          select: {
            id: true,
            fileUrl: true,
          },
        },
        stops: {
          where: {
            stopType: 'DELIVERY',
          },
          select: {
            actualArrival: true,
            actualDeparture: true,
          },
          orderBy: {
            sequence: 'desc',
          },
          take: 1,
          // Get the last delivery stop
        },
      },
      orderBy: {
        deliveryDate: 'desc',
      },
    });

    // Transform data for frontend
    const transformedLoads = loads.map((load) => {
      // Check if POD is missing
      const hasPOD = load.documents.some((doc) => doc.fileUrl && doc.fileUrl.trim() !== '');

      // Calculate age (days since delivery)
      const deliveryDate = load.deliveryDate || load.stops[0]?.actualDeparture || load.stops[0]?.actualArrival;
      const ageInDays = deliveryDate
        ? Math.floor((new Date().getTime() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: load.id,
        loadNumber: load.loadNumber,
        customerName: load.customer.name,
        customerNumber: load.customer.customerNumber,
        isBillingHold: load.isBillingHold,
        billingHoldReason: load.billingHoldReason,
        status: load.status,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        ageInDays,
        hasPOD,
        missingPOD: !hasPOD,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedLoads,
    });
  } catch (error: any) {
    console.error('Error fetching billing exceptions:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch billing exceptions' },
      },
      { status: 500 }
    );
  }
}

