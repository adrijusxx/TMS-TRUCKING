import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createDriverSchema } from '@/lib/validations/driver';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { hasPermission } from '@/lib/permissions';
import { calculateDriverTariff } from '@/lib/utils/driverTariff';
import { buildMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { getDriverFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

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
    if (!hasPermission(session.user.role as any, 'drivers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 500);
    const skip = (page - 1) * limit;
    const tab = searchParams.get('tab') || 'all';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const licenseState = searchParams.get('licenseState');
    const homeTerminal = searchParams.get('homeTerminal');
    const minRating = searchParams.get('minRating');
    const mcViewMode = searchParams.get('mc'); // 'all' or specific MC ID
    const mcNumber = searchParams.get('mcNumber'); // Filter by MC number value
    const mcNumberIdFilter = searchParams.get('mcNumberId');
    const isActiveParam = searchParams.get('isActive'); // Filter by isActive

    // Apply role-based filtering (separate from MC filtering)
    const roleFilter = await getDriverFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );

    // Parse includeDeleted parameter (admins only)
    const includeDeleted = parseIncludeDeleted(request);
    
    // Build deleted records filter (admins can include deleted records if requested)
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);
    
    // Merge MC filter with role filter and deleted filter
    const where: any = {
      ...mcWhere,
      ...roleFilter,
      ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
    }

    // Handle explicit MC number filter from table filter (overrides default MC view)
    if (mcNumberIdFilter) {
      if (mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned') {
        where.mcNumberId = null;
      } else {
        where.mcNumberId = mcNumberIdFilter;
      }
    }

    // Handle isActive parameter filter (used by settlement form)
    if (isActiveParam === 'true') {
      where.isActive = true;
      where.employeeStatus = 'ACTIVE';
    } else if (isActiveParam === 'false') {
      where.isActive = false;
    }

    // Filter drivers by MC number if provided
    // Drivers can be filtered by:
    // 1. Driver's mcNumber field (if set)
    // 2. Driver's user's mcNumberId (if user is assigned to an MC number)
    if (mcNumber && mcViewMode !== 'all') {
      // Get the MC number record to find its ID
      const mcNumberRecord = await prisma.mcNumber.findFirst({
        where: {
          number: mcNumber.trim(),
          companyId: session.user.companyId,
        },
        select: { id: true },
      });

      if (mcNumberRecord) {
        // Filter by driver's mcNumberId OR user's mcNumberId
        // mcNumber is a relation field, so we use mcNumberId (the foreign key)
        const existingOR = where.OR || [];
        where.OR = [
          ...existingOR,
          { mcNumberId: mcNumberRecord.id },
          { user: { mcNumberId: mcNumberRecord.id } },
        ];
      } else {
        // If MC number record not found, try to find by number in relation
        // mcNumber is a relation, so we need to filter by the relation's number field
        const existingOR = where.OR || [];
        where.OR = [
          ...existingOR,
          { mcNumber: { number: mcNumber.trim() } },
        ];
      }
    }

    // Tab-based filtering
    // When showing deleted records (includeDeleted=true), don't filter by employeeStatus
    // as deleted drivers may have any employee status
    if (!includeDeleted) {
      switch (tab) {
        case 'active':
          where.isActive = true;
          where.employeeStatus = 'ACTIVE';
          break;
        case 'unassigned':
          where.isActive = true;
          where.employeeStatus = 'ACTIVE';
          where.currentTruckId = null;
          break;
        case 'terminated':
          where.employeeStatus = 'TERMINATED';
          break;
        case 'vacation':
          where.isActive = true;
          where.status = 'ON_LEAVE';
          break;
        case 'all':
        default:
          // Show all drivers (active and terminated) - no employeeStatus filter
          break;
      }
    } else {
      // When showing deleted records, only apply basic filters that make sense
      switch (tab) {
        case 'unassigned':
          // Even for deleted, we can filter by truck assignment
          where.currentTruckId = null;
          break;
        case 'vacation':
          // Status-based filter still applies
          where.status = 'ON_LEAVE';
          break;
        case 'active':
        case 'terminated':
        case 'all':
        default:
          // Don't filter by employeeStatus when showing deleted records
          break;
      }
    }

    if (status) {
      // Validate status is a valid DriverStatus enum value
      const validStatuses = ['AVAILABLE', 'ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH', 'ON_LEAVE', 'INACTIVE', 'IN_TRANSIT', 'DISPATCHED'];
      if (validStatuses.includes(status)) {
        where.status = status as any;
      } else if (status === 'ACTIVE') {
        // ACTIVE is not a DriverStatus, use employeeStatus instead
        // Only filter by employeeStatus if not showing deleted records
        if (!includeDeleted) {
          where.employeeStatus = 'ACTIVE';
          where.isActive = true;
        }
        // Explicitly do NOT set where.status to prevent Prisma errors
        delete where.status;
      }
    }

    // Final safeguard: ensure status is never 'ACTIVE' in the where clause
    // Only apply employeeStatus filter if not showing deleted records
    if (where.status === 'ACTIVE' && !includeDeleted) {
      delete where.status;
      where.employeeStatus = 'ACTIVE';
      where.isActive = true;
    }

    if (licenseState) {
      where.licenseState = { contains: licenseState, mode: 'insensitive' };
    }

    if (homeTerminal) {
      where.homeTerminal = { contains: homeTerminal, mode: 'insensitive' };
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    // Handle search - merge with MC number OR conditions if they exist
    if (search) {
      const searchConditions = [
        { driverNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
      
      if (where.OR && Array.isArray(where.OR)) {
        // If OR already exists (from MC number filtering), combine conditions
        // We need both MC number match AND search match, so use AND with OR groups
        const existingOR = [...where.OR];
        where.AND = [
          { OR: existingOR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        select: {
          id: true,
          driverNumber: true,
          licenseNumber: true,
          licenseState: true,
          licenseExpiry: true,
          medicalCardExpiry: true,
          drugTestDate: true,
          backgroundCheck: true,
          status: true,
          employeeStatus: true,
          assignmentStatus: true,
          dispatchStatus: true,
          driverType: true,
          deletedAt: true, // Include deletedAt for UI indicators
          isActive: true,
          mcNumberId: true,
          mcNumber: {
            select: {
              id: true,
              number: true,
              companyName: true,
            },
          },
          teamDriver: true,
          payTo: true,
          driverTariff: true,
          warnings: true,
          notes: true,
          hireDate: true,
          terminationDate: true,
          driverTags: true,
          homeTerminal: true,
          emergencyContact: true,
          emergencyPhone: true,
          payType: true,
          payRate: true,
          escrowTargetAmount: true,
          escrowDeductionPerWeek: true,
          escrowBalance: true,
          rating: true,
          totalLoads: true,
          totalMiles: true,
          onTimePercentage: true,
          currentTruckId: true,
          currentTruck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
          currentTrailerId: true,
          currentTrailer: {
            select: {
              id: true,
              trailerNumber: true,
            },
          },
          loads: {
            select: {
              revenue: true,
              driverPay: true,
              totalMiles: true,
              loadedMiles: true,
              emptyMiles: true,
              serviceFee: true,
            },
            take: 100, // Get recent loads for tariff calculation
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ]);

    // Calculate driver tariff for each driver based on their loads
    const driversWithTariff = drivers.map((driver) => {
      const tariff = calculateDriverTariff({
        payType: driver.payType,
        payRate: driver.payRate,
        loads: driver.loads || [],
      });

      return {
        ...driver,
        firstName: driver.user.firstName,
        lastName: driver.user.lastName,
        email: driver.user.email,
        phone: driver.user.phone,
        driverTariff: driver.driverTariff || tariff,
        truck: driver.currentTruck,
        trailer: driver.currentTrailer,
        tags: driver.driverTags || [],
        userId: driver.user.id,
        currentTruckId: driver.currentTruckId,
        currentTrailerId: driver.currentTrailerId,
        mcNumberId: driver.mcNumberId || null,
      };
    });

    // Filter sensitive fields based on role
    const filteredDrivers = driversWithTariff.map((driver) =>
      filterSensitiveFields(driver, session.user.role as any)
    );

    return NextResponse.json({
      success: true,
      data: filteredDrivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Driver list error:', error);
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

    // Check permission to create drivers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'drivers.create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create drivers',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createDriverSchema.parse(body);

    // Check if dispatcher is trying to set financial fields during creation
    // Dispatchers can create drivers but cannot set pay rates
    if (role === 'DISPATCHER' && (validated.payType || validated.payRate)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Dispatchers cannot set pay rates when creating drivers. Pay rates must be set by administrators or accountants.',
          },
        },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    // Check if driver number already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { driverNumber: validated.driverNumber },
    });

    if (existingDriver) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Driver number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Determine MC number assignment
    // Rule: Admins and users with multiple MC access can choose MC; others use their default MC
    const isAdmin = session.user.role === 'ADMIN';
    const { McStateManager } = await import('@/lib/managers/McStateManager');
    const userMcAccess = McStateManager.getMcAccess(session);
    let assignedMcNumberId: string | null = null;

    if (validated.mcNumberId) {
      // User provided mcNumberId - validate they have access
      if (await McStateManager.canAccessMc(session, validated.mcNumberId)) {
        // Also validate MC number exists and belongs to company
        const mcNumber = await prisma.mcNumber.findFirst({
          where: {
            id: validated.mcNumberId,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });

        if (!mcNumber) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_MC_NUMBER',
                message: 'MC number not found or does not belong to your company',
              },
            },
            { status: 400 }
          );
        }
        assignedMcNumberId = validated.mcNumberId;
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
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'MC number is required. Please ensure your account has an MC number assigned.',
              },
            },
            { status: 400 }
          );
        }
      }
      
      if (!assignedMcNumberId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'MC number is required. Please ensure your account has an MC number assigned.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Convert date strings to Date objects
    const licenseExpiry = validated.licenseExpiry instanceof Date
      ? validated.licenseExpiry
      : new Date(validated.licenseExpiry);
    const medicalCardExpiry = validated.medicalCardExpiry instanceof Date
      ? validated.medicalCardExpiry
      : new Date(validated.medicalCardExpiry);

    // Create user first (with MC number for DRIVER role - synced from Driver record)
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        role: 'DRIVER',
        companyId: session.user.companyId,
        mcNumberId: assignedMcNumberId, // Admin can choose, employee uses their default
        mcAccess: [assignedMcNumberId], // Driver has access to their assigned MC
      },
    });

    // Create driver
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        companyId: session.user.companyId,
        driverNumber: validated.driverNumber,
        licenseNumber: validated.licenseNumber,
        licenseState: validated.licenseState,
        licenseExpiry,
        medicalCardExpiry,
        drugTestDate: validated.drugTestDate
          ? (validated.drugTestDate instanceof Date ? validated.drugTestDate : new Date(validated.drugTestDate))
          : null,
        backgroundCheck: validated.backgroundCheck
          ? (validated.backgroundCheck instanceof Date ? validated.backgroundCheck : new Date(validated.backgroundCheck))
          : null,
        payType: validated.payType,
        payRate: validated.payRate,
        homeTerminal: validated.homeTerminal,
        emergencyContact: validated.emergencyContact,
        emergencyPhone: validated.emergencyPhone,
        mcNumberId: assignedMcNumberId, // Admin can choose, employee uses their default
        status: 'AVAILABLE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: driver,
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

    console.error('Driver creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

