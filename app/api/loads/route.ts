import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createLoadSchema, validateLoadForAccounting } from '@/lib/validations/load';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { getLoadFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'loads.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    // New logic: buildMcNumberWhereClause handles all cases (admin all/filtered, employee assigned)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const statusParams = searchParams.getAll('status');
    const customerIdParams = searchParams.getAll('customerId');
    const driverIdParams = searchParams.getAll('driverId');
    const truckIdParams = searchParams.getAll('truckId');
    const search = searchParams.get('search');
    const pickupCity = searchParams.get('pickupCity');
    const pickupState = searchParams.get('pickupState');
    const deliveryCity = searchParams.get('deliveryCity');
    const deliveryState = searchParams.get('deliveryState');
    const pickupDate = searchParams.get('pickupDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const revenue = searchParams.get('revenue');
    const miles = searchParams.get('miles');
    const truckNumber = searchParams.get('truckNumber');
    const dispatcherId = searchParams.get('dispatcherId');
    const mcNumberIdFilter = searchParams.get('mcNumberId');
    const createdToday = searchParams.get('createdToday') === 'true';
    const pickupToday = searchParams.get('pickupToday') === 'true';
    const createdLast24h = searchParams.get('createdLast24h') === 'true';
    const hasMissingDocuments = searchParams.get('hasMissingDocuments');
    
    // Debug: Log quick filter params
    console.log('[Loads API] Quick filter params:', {
      createdToday: searchParams.get('createdToday'),
      createdTodayBool: createdToday,
      pickupToday: searchParams.get('pickupToday'),
      pickupTodayBool: pickupToday,
      createdLast24h: searchParams.get('createdLast24h'),
      createdLast24hBool: createdLast24h,
    });
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 4. Apply role-based filtering (separate from MC filtering)
    const roleFilter = await getLoadFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );
    
    // Debug logging for role filter
    console.log('[Loads API] Role Filter:', {
      role: session.user.role,
      userId: session.user.id,
      roleFilter,
    });

    // Parse includeDeleted parameter (admins only)
    const includeDeleted = parseIncludeDeleted(request);
    
    // Build deleted records filter (admins can include deleted records if requested)
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);
    
    // 5. Merge MC filter with role filter and deleted filter
    // MC filter includes companyId and mcNumberId (if applicable)
    // Role filter includes role-specific constraints (e.g., dispatcher sees their loads)
    // NOTE: When merging, roleFilter may have companyId and deletedAt which will override mcWhere
    // This is intentional - roleFilter's companyId and deletedAt take precedence
    const where: any = {
      ...mcWhere,
      ...roleFilter,
      ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
    };
    
    // Debug: Log final where clause structure
    console.log('[Loads API] Final Where Clause:', {
      companyId: where.companyId,
      mcNumberId: where.mcNumberId,
      dispatcherId: where.dispatcherId,
      driverId: where.driverId,
      OR: where.OR,
      deletedAt: where.deletedAt,
    });
    
    // Debug: Check if there are any loads at all for this company (without MC filter)
    const totalLoadsInCompany = await prisma.load.count({
      where: {
        companyId: where.companyId,
        deletedAt: null,
      },
    });
    console.log('[Loads API] Total loads in company (no MC filter):', totalLoadsInCompany);
    
    // Debug: Check loads with the current MC filter
    const loadsWithMcFilter = await prisma.load.count({
      where,
    });
    console.log('[Loads API] Loads matching current filter:', loadsWithMcFilter);
    
    // Debug: Check loads with null MC number
    const loadsWithNullMc = await prisma.load.count({
      where: {
        companyId: where.companyId,
        mcNumberId: null,
        deletedAt: null,
      },
    });
    console.log('[Loads API] Loads with null MC number:', loadsWithNullMc);
    
    // Debug: Check loads by MC number distribution
    if (where.mcNumberId && typeof where.mcNumberId === 'object' && 'in' in where.mcNumberId) {
      const mcIds = where.mcNumberId.in;
      for (const mcId of mcIds) {
        const count = await prisma.load.count({
          where: {
            companyId: where.companyId,
            mcNumberId: mcId,
            deletedAt: null,
          },
        });
        console.log(`[Loads API] Loads with MC ${mcId}:`, count);
      }
    }

    // Handle explicit MC number filter from table filter (overrides default MC view)
    if (mcNumberIdFilter) {
      if (mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned') {
        where.mcNumberId = null;
      } else {
        where.mcNumberId = mcNumberIdFilter;
      }
    }

    // Handle missing documents filter
    if (hasMissingDocuments === 'true') {
      // Filter for loads that are missing at least one required document
      // A load is missing documents if it doesn't have all of: BOL, POD, RATE_CONFIRMATION
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          // Missing BOL
          {
            documents: {
              none: {
                type: 'BOL',
                deletedAt: null,
              },
            },
          },
          // Missing POD
          {
            documents: {
              none: {
                type: 'POD',
                deletedAt: null,
              },
            },
          },
          // Missing RATE_CONFIRMATION
          {
            documents: {
              none: {
                type: 'RATE_CONFIRMATION',
                deletedAt: null,
              },
            },
          },
        ],
      });
    } else if (hasMissingDocuments === 'false') {
      // Filter for loads that have all required documents
      where.AND = where.AND || [];
      where.AND.push({
        AND: [
          // Has BOL
          {
            documents: {
              some: {
                type: 'BOL',
                deletedAt: null,
              },
            },
          },
          // Has POD
          {
            documents: {
              some: {
                type: 'POD',
                deletedAt: null,
              },
            },
          },
          // Has RATE_CONFIRMATION
          {
            documents: {
              some: {
                type: 'RATE_CONFIRMATION',
                deletedAt: null,
              },
            },
          },
        ],
      });
    }

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

    if (customerIdParams.length > 0) {
      if (customerIdParams.length === 1) {
        where.customerId = customerIdParams[0];
      } else {
        where.customerId = { in: customerIdParams };
      }
    }

    if (driverIdParams.length > 0) {
      if (driverIdParams.length === 1) {
        where.driverId = driverIdParams[0];
      } else {
        where.driverId = { in: driverIdParams };
      }
    }

    if (truckIdParams.length > 0) {
      if (truckIdParams.length === 1) {
        where.truckId = truckIdParams[0];
      } else {
        where.truckId = { in: truckIdParams };
      }
    }

    if (pickupCity) {
      where.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    }

    if (pickupState) {
      where.pickupState = { contains: pickupState, mode: 'insensitive' };
    }

    if (deliveryCity) {
      where.deliveryCity = { contains: deliveryCity, mode: 'insensitive' };
    }

    if (deliveryState) {
      where.deliveryState = { contains: deliveryState, mode: 'insensitive' };
    }

    if (truckNumber) {
      where.truck = {
        truckNumber: { contains: truckNumber, mode: 'insensitive' },
      };
    }

    if (miles) {
      where.totalMiles = { gte: parseFloat(miles) };
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

    // Handle date range filter - combine with existing OR if search exists
    if (startDate && endDate) {
      const dateRangeOr = [
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
      
      if (where.OR) {
        // If OR already exists (from search), combine them with AND
        where.AND = [
          { OR: where.OR },
          { OR: dateRangeOr },
        ];
        delete where.OR;
      } else {
        where.OR = dateRangeOr;
      }
    }

    if (revenue) {
      where.revenue = { gte: parseFloat(revenue) };
    }

    // Filter by dispatcher ID if specified
    if (dispatcherId) {
      where.assignedDispatcherId = dispatcherId;
    }

    // Handle date-based quick filters
    // Note: createdToday and createdLast24h both filter on createdAt
    // If both are set, createdToday takes precedence (more specific)
    if (createdToday) {
      const now = new Date();
      // Set to start of today in local timezone
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.createdAt = {
        gte: today,
        lt: tomorrow,
      };
      console.log('[Loads API] Created Today filter:', { 
        today: today.toISOString(), 
        tomorrow: tomorrow.toISOString(), 
        createdToday,
        now: now.toISOString()
      });
    } else if (createdLast24h) {
      // Only apply createdLast24h if createdToday is not set (to avoid conflict)
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      where.createdAt = {
        gte: last24h,
      };
      console.log('[Loads API] Created Last 24h filter:', { 
        last24h: last24h.toISOString(), 
        now: now.toISOString(), 
        createdLast24h 
      });
    }

    if (pickupToday) {
      const now = new Date();
      // Set to start of today in local timezone
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.pickupDate = {
        gte: today,
        lt: tomorrow,
      };
      console.log('[Loads API] Pickup Today filter:', { 
        today: today.toISOString(), 
        tomorrow: tomorrow.toISOString(), 
        pickupToday 
      });
    }

    // Handle search filter - combine with existing OR if date range exists
    if (search) {
      const searchOr = [
        { loadNumber: { contains: search, mode: 'insensitive' } },
        { commodity: { contains: search, mode: 'insensitive' } },
        { pickupCity: { contains: search, mode: 'insensitive' } },
        { pickupState: { contains: search, mode: 'insensitive' } },
        { deliveryCity: { contains: search, mode: 'insensitive' } },
        { deliveryState: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { driver: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { truck: { truckNumber: { contains: search, mode: 'insensitive' } } },
        { trailerNumber: { contains: search, mode: 'insensitive' } },
      ];
      
      if (where.OR) {
        // If OR already exists (from date range), combine them with AND
        where.AND = [
          { OR: where.OR },
          { OR: searchOr },
        ];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }


    // Log the where clause for debugging (remove sensitive data)
    const mcState = await McStateManager.getMcState(session, request);
    console.log('[Loads API] Query where clause:', {
      userId: session.user.id,
      role: session.user.role,
      companyId: where.companyId,
      mcNumberId: where.mcNumberId,
      mcState: {
        viewMode: mcState.viewMode,
        mcNumberIds: mcState.mcNumberIds,
        mcAccessFromDb: await McStateManager.getMcAccessFromDb(session.user.id),
      },
      hasOR: !!where.OR,
      hasAND: !!where.AND,
      deletedAt: where.deletedAt,
    });

    const [loads, total, sums, allLoadsForStats] = await Promise.all([
      prisma.load.findMany({
        where,
        select: {
          id: true,
          loadNumber: true,
          status: true,
          dispatchStatus: true,
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
          deletedAt: true, // Include deletedAt for UI indicators
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
                  phone: true,
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
              phone: true,
            },
          },
          mcNumber: {
            select: {
              id: true,
              number: true,
              companyName: true,
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
          rateConfirmation: {
            select: {
              id: true,
              rateConfNumber: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
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
          emptyMiles: true,
          serviceFee: true,
        },
      }),
      // Fetch all loads matching filter (just miles fields) to calculate accurate loaded miles
      prisma.load.findMany({
        where,
        select: {
          totalMiles: true,
          loadedMiles: true,
          emptyMiles: true,
        },
      }),
    ]);

    const revenueSum = Number(sums._sum.revenue ?? 0);
    const totalPaySum = Number(sums._sum.totalPay ?? 0);
    const driverPaySum = Number(sums._sum.driverPay ?? 0);
    const totalMilesSum = Number(sums._sum.totalMiles ?? 0);
    const emptyMilesSum = Number(sums._sum.emptyMiles ?? 0);
    const serviceFeeSum = Number(sums._sum.serviceFee ?? 0);
    
    // Calculate loaded miles per load when missing, then sum for accurate totals
    // For each load: if loadedMiles is missing, calculate as totalMiles - emptyMiles
    // This ensures RPM calculations are accurate
    let calculatedLoadedMilesSum = 0;
    for (const load of allLoadsForStats) {
      const totalMiles = Number(load.totalMiles ?? 0);
      const loadedMiles = Number(load.loadedMiles ?? 0);
      const emptyMiles = Number(load.emptyMiles ?? 0);
      
      // If loadedMiles is missing or 0, calculate it from totalMiles - emptyMiles
      const calculatedLoadedMiles = loadedMiles > 0 
        ? loadedMiles 
        : Math.max(totalMiles - emptyMiles, 0);
      
      calculatedLoadedMilesSum += calculatedLoadedMiles;
    }
    
    const derivedLoadedMiles = calculatedLoadedMilesSum;
    
    // RPM calculations: only calculate if we have valid miles
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

    // 5. Add missing documents information to each load
    const REQUIRED_DOCUMENTS = ['BOL', 'POD', 'RATE_CONFIRMATION'] as const;
    const loadsWithDocumentStatus = loads.map((load) => {
      const documentTypes = load.documents?.map((doc: any) => doc.type) || [];
      const missingDocuments = REQUIRED_DOCUMENTS.filter(
        (type) => !documentTypes.includes(type)
      );
      
      return {
        ...load,
        missingDocuments,
        hasMissingDocuments: missingDocuments.length > 0,
      };
    });

    // 6. Filter Sensitive Fields based on role
    const filteredLoads = loadsWithDocumentStatus.map((load) =>
      filterSensitiveFields(load, session.user.role as any)
    );
    const filteredStats = filterSensitiveFields(stats, session.user.role as any);

    // 6. Return Success Response
    return NextResponse.json({
      success: true,
      data: filteredLoads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: filteredStats,
    });
  } catch (error) {
    console.error('Load list error:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Something went wrong' 
        },
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

    // Perform accounting validation
    const accountingValidation = validateLoadForAccounting(validated);
    
    // Log accounting warnings (but don't block creation)
    if (accountingValidation.warnings.length > 0) {
      console.log('[Loads API] Accounting warnings:', accountingValidation.warnings);
    }

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

    // Determine MC number assignment
    // Rule: Admins and users with multiple MC access can choose MC; others use their default MC
    const isAdmin = session.user.role === 'ADMIN';
    const userMcAccess = McStateManager.getMcAccess(session);
    const hasMultipleMcAccess = userMcAccess.length > 1 || (isAdmin && userMcAccess.length === 0);
    let assignedMcNumberId: string | null = null;

    // Check if mcNumberId was provided (from request body, not validation schema)
    const bodyMcNumberId = (body as any).mcNumberId;
    
    if (bodyMcNumberId) {
      // User provided mcNumberId - validate they have access
      if (await McStateManager.canAccessMc(session, bodyMcNumberId)) {
        assignedMcNumberId = bodyMcNumberId;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have access to the selected MC number',
            },
          },
          { status: 403 }
        );
      }
    } else {
      // No mcNumberId provided - use user's default MC
      assignedMcNumberId = (session.user as any).mcNumberId || null;
      
      // Validate default MC is accessible
      if (assignedMcNumberId && !(await McStateManager.canAccessMc(session, assignedMcNumberId))) {
        // If default MC is not accessible, try to use first accessible MC
        if (userMcAccess.length > 0) {
          assignedMcNumberId = userMcAccess[0];
        } else {
          // For admins with no mcAccess (full access), try to get a default MC from company
          if (isAdmin) {
            const defaultMc = await prisma.mcNumber.findFirst({
              where: {
                companyId: session.user.companyId,
                isDefault: true,
                deletedAt: null,
              },
            });
            assignedMcNumberId = defaultMc?.id || null;
          } else {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'No accessible MC number found. Please contact an administrator.',
                },
              },
              { status: 403 }
            );
          }
        }
      } else if (!assignedMcNumberId && userMcAccess.length > 0) {
        // No default MC but user has accessible MCs - use first one
        assignedMcNumberId = userMcAccess[0];
      } else if (!assignedMcNumberId && isAdmin) {
        // Admin with no default MC - try to get company default
        const defaultMc = await prisma.mcNumber.findFirst({
          where: {
            companyId: session.user.companyId,
            isDefault: true,
            deletedAt: null,
          },
        });
        assignedMcNumberId = defaultMc?.id || null;
      }
      
      console.log('[Loads API] Assigned MC Number ID:', assignedMcNumberId);
    }

    // Validate driver has MC number if driver is assigned and calculate driver pay
    let calculatedDriverPay: number | null = null;
    if (validated.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: validated.driverId },
        select: { 
          mcNumberId: true,
          payType: true,
          payRate: true,
        },
      });

      if (!driver) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DRIVER',
              message: 'Driver not found',
            },
          },
          { status: 400 }
        );
      }

      if (!driver.mcNumberId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Selected driver must have an MC number assigned. Please assign an MC number to the driver first.',
            },
          },
          { status: 400 }
        );
      }

      // Calculate driver pay based on driver's pay type and rate
      if (driver.payType && driver.payRate !== null && driver.payRate !== undefined) {
        calculatedDriverPay = calculateDriverPay(
          {
            payType: driver.payType,
            payRate: driver.payRate,
          },
          {
            totalMiles: validated.totalMiles ?? null,
            loadedMiles: validated.loadedMiles ?? null,
            emptyMiles: validated.emptyMiles ?? null,
            revenue: validated.revenue ?? null,
          }
        );
        console.log(`[Loads API] Calculated driver pay: $${calculatedDriverPay?.toFixed(2)} for driver using ${driver.payType} at rate ${driver.payRate}`);
      } else {
        console.warn(`[Loads API] Driver ${validated.driverId} missing payType or payRate - driver pay will be $0`);
      }
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
      // Driver and equipment assignment
      driverId: loadData.driverId || null,
      truckId: loadData.truckId || null,
      trailerId: loadData.trailerId || null,
      // Assign mcNumberId: Admin can choose, employee uses their default
      mcNumberId: assignedMcNumberId,
      // Ensure all numeric fields are properly set
      weight: loadData.weight || 0,
      revenue: loadData.revenue || 0,
      fuelAdvance: loadData.fuelAdvance || 0,
      expenses: 0,
      driverPay: calculatedDriverPay ?? (loadData.driverPay ?? 0),
      hazmat: loadData.hazmat || false,
      // Additional fields
      pickupCompany: loadData.pickupCompany || null,
      pickupContact: loadData.pickupContact || null,
      pickupPhone: loadData.pickupPhone || null,
      pickupNotes: loadData.pickupNotes || null,
      deliveryCompany: loadData.deliveryCompany || null,
      deliveryContact: loadData.deliveryContact || null,
      deliveryPhone: loadData.deliveryPhone || null,
      deliveryNotes: loadData.deliveryNotes || null,
      // Load specifications
      pallets: loadData.pallets || null,
      temperature: loadData.temperature || null,
      hazmatClass: loadData.hazmatClass || null,
      // Financial
      serviceFee: loadData.serviceFee || null,
      revenuePerMile: loadData.revenuePerMile || null,
      // Additional assignments
      coDriverId: loadData.coDriverId || null,
      dispatcherId: loadData.dispatcherId || null,
      tripId: loadData.tripId || null,
      shipmentId: loadData.shipmentId || null,
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
        meta: {
          accounting: {
            canInvoice: accountingValidation.canInvoice,
            canSettle: accountingValidation.canSettle,
            warnings: accountingValidation.warnings,
            missingForInvoice: accountingValidation.missingForInvoice,
            missingForSettlement: accountingValidation.missingForSettlement,
          },
        },
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

