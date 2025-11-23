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

    // Apply role-based filtering
    const { mcNumberId } = await getCurrentMcNumber(session, request);
    const roleFilter = await getDriverFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId,
        mcNumberId ?? undefined
      )
    );

    // Build base where clause
    const where: any = {
      ...roleFilter,
      companyId: session.user.companyId,
      deletedAt: null,
    };

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
        // Show all drivers (active and terminated)
        break;
    }

    if (status) {
      // Validate status is a valid DriverStatus enum value
      const validStatuses = ['AVAILABLE', 'ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH', 'ON_LEAVE', 'INACTIVE', 'IN_TRANSIT', 'DISPATCHED'];
      if (validStatuses.includes(status)) {
        where.status = status as any;
      } else if (status === 'ACTIVE') {
        // ACTIVE is not a DriverStatus, use employeeStatus instead
        where.employeeStatus = 'ACTIVE';
        where.isActive = true;
        // Explicitly do NOT set where.status to prevent Prisma errors
        delete where.status;
      }
    }

    // Final safeguard: ensure status is never 'ACTIVE' in the where clause
    if (where.status === 'ACTIVE') {
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
          mcNumber: {
            select: {
              id: true,
              number: true,
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

    // Validate MC number exists and belongs to company
    if (validated.mcNumberId) {
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
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'MC number is required',
          },
        },
        { status: 400 }
      );
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
        mcNumberId: validated.mcNumberId, // Set MC number for driver user
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
        mcNumberId: validated.mcNumberId,
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

