import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createLoadSchema } from '@/lib/validations/load';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const statusParams = searchParams.getAll('status'); // Get all status params
    const customerId = searchParams.get('customerId');
    const driverId = searchParams.get('driverId');
    const search = searchParams.get('search');
    const pickupCity = searchParams.get('pickupCity');
    const deliveryCity = searchParams.get('deliveryCity');
    const pickupDate = searchParams.get('pickupDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const revenue = searchParams.get('revenue');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    // Handle multiple status values
    if (statusParams.length > 0) {
      const statuses = statusParams.filter((s) => s !== 'all');
      if (statuses.length === 1) {
        const status = statuses[0];
        if (status === 'IN_TRANSIT') {
          where.status = {
            in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
          };
        } else {
          where.status = status;
        }
      } else if (statuses.length > 1) {
        // Multiple status values - use IN operator
        // Filter out IN_TRANSIT and expand it to valid statuses
        const validStatuses: string[] = [];
        for (const status of statuses) {
          if (status === 'IN_TRANSIT') {
            validStatuses.push('ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY');
          } else {
            validStatuses.push(status);
          }
        }
        // Remove duplicates
        const uniqueStatuses = [...new Set(validStatuses)];
        where.status = {
          in: uniqueStatuses,
        };
      }
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (pickupCity) {
      where.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    }

    if (deliveryCity) {
      where.deliveryCity = { contains: deliveryCity, mode: 'insensitive' };
    }

    if (pickupDate) {
      const date = new Date(pickupDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.pickupDate = {
        gte: date,
        lt: nextDay,
      };
    }

    if (startDate && endDate) {
      where.OR = [
        {
          pickupDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          deliveryDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      ];
    }

    if (revenue) {
      where.revenue = { gte: parseFloat(revenue) };
    }

    if (search) {
      where.OR = [
        { loadNumber: { contains: search, mode: 'insensitive' } },
        { commodity: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Log the where clause for debugging
    console.log('[GET /api/loads] Query params:', {
      page,
      limit,
      statusParams,
      search,
      where: JSON.stringify(where, null, 2),
    });

    const [loads, total, sums] = await Promise.all([
      prisma.load.findMany({
        where,
        select: {
          id: true,
          loadNumber: true,
          status: true,
          pickupLocation: true,
          pickupCity: true,
          pickupState: true,
          pickupDate: true,
          deliveryLocation: true,
          deliveryCity: true,
          deliveryState: true,
          deliveryDate: true,
          revenue: true,
          driverPay: true,
          totalPay: true,
          totalMiles: true,
          loadedMiles: true,
          emptyMiles: true,
          trailerNumber: true,
          shipmentId: true,
          stopsCount: true,
          serviceFee: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              customerNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              driverNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          truck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
          dispatcher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          stops: {
            select: {
              id: true,
              stopType: true,
              sequence: true,
              city: true,
              state: true,
            },
            orderBy: { sequence: 'asc' },
          },
          documents: {
            where: { deletedAt: null },
            select: {
              id: true,
              type: true,
              title: true,
              fileName: true,
              fileUrl: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Limit to 5 most recent documents for list view
          },
          statusHistory: {
            select: {
              createdBy: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' }, // Get the first entry (when load was created/imported)
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.load.count({ where }),
      prisma.load.aggregate({
        where,
        _sum: {
          totalPay: true,
          revenue: true,
          driverPay: true,
          totalMiles: true,
          loadedMiles: true,
          emptyMiles: true,
          serviceFee: true,
        },
      }),
    ]);

    const revenueSum = Number(sums._sum.revenue ?? 0);
    const totalPaySum = Number(sums._sum.totalPay ?? 0);
    const driverPaySum = Number(sums._sum.driverPay ?? 0);
    const totalMilesSum = Number(sums._sum.totalMiles ?? 0);
    const loadedMilesSum = Number(sums._sum.loadedMiles ?? 0);
    const emptyMilesSum = Number(sums._sum.emptyMiles ?? 0);
    const serviceFeeSum = Number(sums._sum.serviceFee ?? 0);
    const derivedLoadedMiles =
      loadedMilesSum > 0 ? loadedMilesSum : Math.max(totalMilesSum - emptyMilesSum, 0);
    const rpmLoadedMiles =
      derivedLoadedMiles > 0 ? revenueSum / derivedLoadedMiles : null;
    const rpmTotalMiles = totalMilesSum > 0 ? revenueSum / totalMilesSum : null;

    const stats = {
      totalPay: totalPaySum,
      totalLoadPay: revenueSum,
      driverGross: driverPaySum,
      totalMiles: totalMilesSum,
      loadedMiles: derivedLoadedMiles,
      emptyMiles: emptyMilesSum,
      rpmLoadedMiles,
      rpmTotalMiles,
      serviceFee: serviceFeeSum,
    };

    console.log('[GET /api/loads] Returning:', {
      loadsCount: loads.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      firstLoadId: loads[0]?.id,
      firstLoadNumber: loads[0]?.loadNumber,
      firstLoadRevenue: loads[0]?.revenue,
      firstLoadDriverPay: loads[0]?.driverPay,
      firstLoadTotalPay: loads[0]?.totalPay,
      firstLoadTotalMiles: loads[0]?.totalMiles,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: loads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Load list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
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

    // Check permission to create loads
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'loads.create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create loads',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createLoadSchema.parse(body);

    // Check if load number already exists in this company
    const existingLoad = await prisma.load.findFirst({
      where: {
        loadNumber: validated.loadNumber,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (existingLoad) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Load number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Handle multi-stop vs single-stop loads
    let pickupDate: Date | null = null;
    let deliveryDate: Date | null = null;
    let pickupTimeStart: Date | null = null;
    let pickupTimeEnd: Date | null = null;
    let deliveryTimeStart: Date | null = null;
    let deliveryTimeEnd: Date | null = null;
    
    // Location fields for route display (populated from first pickup and last delivery for multi-stop loads)
    let pickupLocation: string | null = null;
    let pickupAddress: string | null = null;
    let pickupCity: string | null = null;
    let pickupState: string | null = null;
    let pickupZip: string | null = null;
    let deliveryLocation: string | null = null;
    let deliveryAddress: string | null = null;
    let deliveryCity: string | null = null;
    let deliveryState: string | null = null;
    let deliveryZip: string | null = null;

    // If multi-stop load, use first pickup and last delivery for main dates and location fields
    if (validated.stops && validated.stops.length > 0) {
      const pickups = validated.stops.filter(s => s.stopType === 'PICKUP').sort((a, b) => a.sequence - b.sequence);
      const deliveries = validated.stops.filter(s => s.stopType === 'DELIVERY').sort((a, b) => a.sequence - b.sequence);
      
      if (pickups.length > 0) {
        const firstPickup = pickups[0];
        pickupLocation = firstPickup.company || null;
        pickupAddress = firstPickup.address || null;
        pickupCity = firstPickup.city || null;
        pickupState = firstPickup.state || null;
        pickupZip = firstPickup.zip || null;
        pickupDate = firstPickup.earliestArrival 
          ? (firstPickup.earliestArrival instanceof Date ? firstPickup.earliestArrival : new Date(firstPickup.earliestArrival))
          : new Date();
        pickupTimeStart = firstPickup.earliestArrival instanceof Date ? firstPickup.earliestArrival : null;
        pickupTimeEnd = firstPickup.latestArrival 
          ? (firstPickup.latestArrival instanceof Date ? firstPickup.latestArrival : new Date(firstPickup.latestArrival))
          : null;
      }
      
      if (deliveries.length > 0) {
        const lastDelivery = deliveries[deliveries.length - 1];
        deliveryLocation = lastDelivery.company || null;
        deliveryAddress = lastDelivery.address || null;
        deliveryCity = lastDelivery.city || null;
        deliveryState = lastDelivery.state || null;
        deliveryZip = lastDelivery.zip || null;
        deliveryDate = lastDelivery.latestArrival 
          ? (lastDelivery.latestArrival instanceof Date ? lastDelivery.latestArrival : new Date(lastDelivery.latestArrival))
          : new Date();
        deliveryTimeStart = lastDelivery.earliestArrival 
          ? (lastDelivery.earliestArrival instanceof Date ? lastDelivery.earliestArrival : new Date(lastDelivery.earliestArrival))
          : null;
        deliveryTimeEnd = lastDelivery.latestArrival instanceof Date ? lastDelivery.latestArrival : null;
      }
    } else {
      // Single-stop load - use provided fields
      pickupLocation = validated.pickupLocation || null;
      pickupAddress = validated.pickupAddress || null;
      pickupCity = validated.pickupCity || null;
      pickupState = validated.pickupState || null;
      pickupZip = validated.pickupZip || null;
      deliveryLocation = validated.deliveryLocation || null;
      deliveryAddress = validated.deliveryAddress || null;
      deliveryCity = validated.deliveryCity || null;
      deliveryState = validated.deliveryState || null;
      deliveryZip = validated.deliveryZip || null;
      pickupDate = validated.pickupDate 
        ? (validated.pickupDate instanceof Date 
          ? validated.pickupDate 
          : new Date(validated.pickupDate))
        : null;
      deliveryDate = validated.deliveryDate 
        ? (validated.deliveryDate instanceof Date 
          ? validated.deliveryDate 
          : new Date(validated.deliveryDate))
        : null;
      pickupTimeStart = validated.pickupTimeStart 
        ? (validated.pickupTimeStart instanceof Date ? validated.pickupTimeStart : new Date(validated.pickupTimeStart))
        : null;
      pickupTimeEnd = validated.pickupTimeEnd 
        ? (validated.pickupTimeEnd instanceof Date ? validated.pickupTimeEnd : new Date(validated.pickupTimeEnd))
        : null;
      deliveryTimeStart = validated.deliveryTimeStart 
        ? (validated.deliveryTimeStart instanceof Date ? validated.deliveryTimeStart : new Date(validated.deliveryTimeStart))
        : null;
      deliveryTimeEnd = validated.deliveryTimeEnd 
        ? (validated.deliveryTimeEnd instanceof Date ? validated.deliveryTimeEnd : new Date(validated.deliveryTimeEnd))
        : null;
    }

    // Prepare load data (remove stops from main load data)
    const { stops, loadedMiles, emptyMiles, totalMiles, ...loadData } = validated;

    // Ensure all required fields are present
    const loadCreateData: any = {
      ...loadData,
      // Location fields (for route display - populated from first pickup/last delivery for multi-stop loads)
      pickupLocation: pickupLocation || loadData.pickupLocation || null,
      pickupAddress: pickupAddress || loadData.pickupAddress || null,
      pickupCity: pickupCity || loadData.pickupCity || null,
      pickupState: pickupState || loadData.pickupState || null,
      pickupZip: pickupZip || loadData.pickupZip || null,
      deliveryLocation: deliveryLocation || loadData.deliveryLocation || null,
      deliveryAddress: deliveryAddress || loadData.deliveryAddress || null,
      deliveryCity: deliveryCity || loadData.deliveryCity || null,
      deliveryState: deliveryState || loadData.deliveryState || null,
      deliveryZip: deliveryZip || loadData.deliveryZip || null,
      // Date fields
      pickupDate: pickupDate || null,
      deliveryDate: deliveryDate || null,
      pickupTimeStart: pickupTimeStart || null,
      pickupTimeEnd: pickupTimeEnd || null,
      deliveryTimeStart: deliveryTimeStart || null,
      deliveryTimeEnd: deliveryTimeEnd || null,
      loadedMiles: loadedMiles ?? null,
      emptyMiles: emptyMiles ?? null,
      totalMiles: totalMiles ?? (loadedMiles != null && emptyMiles != null ? loadedMiles + emptyMiles : null),
      companyId: session.user.companyId,
      status: 'PENDING',
      // Ensure all numeric fields are properly set
      weight: loadData.weight || 0,
      revenue: loadData.revenue || 0,
      fuelAdvance: loadData.fuelAdvance || 0,
      expenses: 0,
      hazmat: loadData.hazmat || false,
      // Create stops if provided
      stops: stops && stops.length > 0 ? {
          create: stops.map((stop) => ({
            stopType: stop.stopType,
            sequence: stop.sequence,
            company: stop.company || null,
            address: stop.address,
            city: stop.city,
            state: stop.state,
            zip: stop.zip,
            phone: stop.phone || null,
            earliestArrival: stop.earliestArrival 
              ? (stop.earliestArrival instanceof Date ? stop.earliestArrival : new Date(stop.earliestArrival))
              : null,
            latestArrival: stop.latestArrival 
              ? (stop.latestArrival instanceof Date ? stop.latestArrival : new Date(stop.latestArrival))
              : null,
            contactName: stop.contactName || null,
            contactPhone: stop.contactPhone || null,
            items: stop.items ? stop.items : null,
            totalPieces: stop.totalPieces || null,
            totalWeight: stop.totalWeight || null,
            notes: stop.notes || null,
            specialInstructions: stop.specialInstructions || null,
          })),
        } : undefined,
    };

    const load = await prisma.load.create({
      data: loadCreateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
        stops: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: load,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Load creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

