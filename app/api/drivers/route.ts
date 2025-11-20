import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createDriverSchema } from '@/lib/validations/driver';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { hasPermission } from '@/lib/permissions';
import { calculateDriverTariff } from '@/lib/utils/driverTariff';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

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

    // Build base where clause - drivers use companyId only (they don't have direct MC number association)
    // When "All MC Numbers" is selected (mc=all), show all drivers from user's company
    // Otherwise, show drivers from the user's company (MC number filtering doesn't apply to drivers)
    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

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
      where.status = status;
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

    if (search) {
      where.OR = [
        { driverNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
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
          mcNumber: true,
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

    return NextResponse.json({
      success: true,
      data: driversWithTariff,
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

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Convert date strings to Date objects
    const licenseExpiry = validated.licenseExpiry instanceof Date
      ? validated.licenseExpiry
      : new Date(validated.licenseExpiry);
    const medicalCardExpiry = validated.medicalCardExpiry instanceof Date
      ? validated.medicalCardExpiry
      : new Date(validated.medicalCardExpiry);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        role: 'DRIVER',
        companyId: session.user.companyId,
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

