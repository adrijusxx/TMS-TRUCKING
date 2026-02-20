/**
 * Loads API Route - GET and POST handlers
 * Refactored to use LoadQueryManager and LoadCreationManager
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createLoadSchema, validateLoadForAccounting } from '@/lib/validations/load';
import { z } from 'zod';
import { UsageManager } from '@/lib/managers/UsageManager';
import { hasPermission } from '@/lib/permissions';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { handleApiError } from '@/lib/api/route-helpers';
import {
  parseQueryParams,
  buildBaseWhereClause,
  applyQueryFilters,
  loadListSelect,
  calculateLoadStats,
  addDocumentStatus,
  buildOrderByClause,
} from '@/lib/managers/LoadQueryManager';
import {
  extractLocationAndDateFields,
  determineMcNumberAssignment,
  validateDriverAndCalculatePay,
  computeDriverPay,
  buildLoadCreateData,
  checkLoadNumberExists,
  geocodeLoadStops,
} from '@/lib/managers/LoadCreationManager';

/**
 * GET /api/loads - List loads with filtering and pagination
 */
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
    if (!hasPermission(session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER', 'loads.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const params = parseQueryParams(request);

    // 4. Build where clause
    const where = await buildBaseWhereClause(session, request);

    // 5. Apply query filters
    applyQueryFilters(where, params);

    // 6. Execute queries
    const [loads, total, sums] = await Promise.all([
      prisma.load.findMany({
        where,
        select: loadListSelect,
        orderBy: buildOrderByClause(params),
        skip: params.skip,
        take: params.limit,
      }),
      prisma.load.count({ where }),
      prisma.load.aggregate({
        where,
        _sum: {
          revenue: true,
          driverPay: true,
          totalMiles: true,
          emptyMiles: true,
          loadedMiles: true,
        },
      }),
    ]);

    // 7. Calculate statistics
    const stats = calculateLoadStats(sums);

    // 8. Add document status to loads
    const loadsWithDocumentStatus = addDocumentStatus(loads);

    // 9. Filter sensitive fields based on role
    const userRole = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    const filteredLoads = loadsWithDocumentStatus.map((load) =>
      filterSensitiveFields(load, userRole)
    );
    const filteredStats = filterSensitiveFields(stats, userRole);

    // 10. Return response
    return NextResponse.json({
      success: true,
      data: filteredLoads,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
      stats: filteredStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/loads - Create a new load
 */
export async function POST(request: NextRequest) {
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
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'loads.create')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to create loads' },
        },
        { status: 403 }
      );
    }

    // 3. Check usage limits
    const usageCheck = await UsageManager.checkLimit(session.user.companyId, 'LOADS_CREATED');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USAGE_LIMIT_EXCEEDED',
            message: `Monthly load limit reached (${usageCheck.current}/${usageCheck.limit}). Upgrade to continue.`,
          },
          usageInfo: usageCheck,
        },
        { status: 402 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validated = createLoadSchema.parse(body);

    // Auto-assign dispatcher to current user if not provided
    if (!validated.dispatcherId && session.user.id) {
      validated.dispatcherId = session.user.id;
    }

    // 4. Perform accounting validation
    const accountingValidation = validateLoadForAccounting(validated);

    // 5. Check for duplicate load number
    if (await checkLoadNumberExists(validated.loadNumber, session.user.companyId)) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Load number already exists' } },
        { status: 409 }
      );
    }

    // 6. Extract location and date fields
    const { location, dates } = extractLocationAndDateFields(validated);

    // 7. Determine MC number assignment (uses dropdown selection from cookies)
    const mcResult = await determineMcNumberAssignment(session, (body as { mcNumberId?: string }).mcNumberId, request);
    if (mcResult.error) {
      return NextResponse.json(mcResult.error, { status: 403 });
    }

    // 8. Validate driver and calculate driver pay
    let calculatedDriverPay: number | null = null;
    if (validated.driverId) {
      const driverResult = await validateDriverAndCalculatePay(validated.driverId, mcResult.mcNumberId);
      if (driverResult.error) {
        return NextResponse.json(driverResult.error, { status: 400 });
      }

      if (driverResult.driver) {
        const driver = driverResult.driver as { payType: string | null; payRate: number | null };
        calculatedDriverPay = computeDriverPay(driver, {
          totalMiles: validated.totalMiles,
          loadedMiles: validated.loadedMiles,
          emptyMiles: validated.emptyMiles,
          revenue: validated.revenue,
        });
      }
    }

    // 9. Build and create the load
    const loadCreateData = buildLoadCreateData(
      validated,
      session,
      location,
      dates,
      mcResult.mcNumberId,
      calculatedDriverPay
    );

    const load = await prisma.load.create({
      data: loadCreateData as Parameters<typeof prisma.load.create>[0]['data'],
      include: {
        customer: {
          select: { id: true, name: true, customerNumber: true },
        },
        stops: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    // 10. Track usage + geocode stops (fire-and-forget)
    await UsageManager.trackUsage(session.user.companyId, 'LOADS_CREATED');
    geocodeLoadStops(load.id).catch(() => {});

    // 11. Return success response
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
    return handleApiError(error);
  }
}
