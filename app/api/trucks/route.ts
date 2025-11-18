import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createTruckSchema } from '@/lib/validations/truck';
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const equipmentType = searchParams.get('equipmentType');
    const licenseState = searchParams.get('licenseState');

    const where: any = {
      companyId: session.user.companyId,
      isActive: true,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (make) {
      where.make = { contains: make, mode: 'insensitive' };
    }

    if (model) {
      where.model = { contains: model, mode: 'insensitive' };
    }

    if (equipmentType) {
      where.equipmentType = equipmentType;
    }

    if (licenseState) {
      where.state = { contains: licenseState, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { truckNumber: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        where,
        include: {
          currentDrivers: {
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
        },
        orderBy: { truckNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.truck.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: trucks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Truck list error:', error);
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

    // Check permission to create trucks
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create trucks',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createTruckSchema.parse(body);

    // Check if truck number already exists
    const existingTruck = await prisma.truck.findUnique({
      where: { truckNumber: validated.truckNumber },
    });

    if (existingTruck) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Truck number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Check if VIN already exists
    const existingVIN = await prisma.truck.findUnique({
      where: { vin: validated.vin },
    });

    if (existingVIN) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'VIN already exists',
          },
        },
        { status: 409 }
      );
    }

    // Convert dates
    const registrationExpiry = validated.registrationExpiry instanceof Date
      ? validated.registrationExpiry
      : new Date(validated.registrationExpiry);
    const insuranceExpiry = validated.insuranceExpiry instanceof Date
      ? validated.insuranceExpiry
      : new Date(validated.insuranceExpiry);
    const inspectionExpiry = validated.inspectionExpiry instanceof Date
      ? validated.inspectionExpiry
      : new Date(validated.inspectionExpiry);

    const truck = await prisma.truck.create({
      data: {
        ...validated,
        registrationExpiry,
        insuranceExpiry,
        inspectionExpiry,
        companyId: session.user.companyId,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: truck,
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
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Truck creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

