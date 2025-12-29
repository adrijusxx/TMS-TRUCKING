import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createFuelEntrySchema = z.object({
  truckId: z.string().cuid(),
  driverId: z.string().cuid().optional(),
  mcNumberId: z.string().cuid().optional(),
  gallons: z.number().positive(),
  costPerGallon: z.number().positive(),
  totalCost: z.number().positive(),
  odometer: z.number().min(0),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  fuelType: z.enum(['DIESEL', 'GAS', 'DEF']).default('DIESEL'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().or(z.date()).optional(),
});

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
    const truckId = searchParams.get('truckId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      truck: {
        companyId: session.user.companyId,
      },
    };

    if (truckId) {
      where.truckId = truckId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const entries = await prisma.fuelEntry.findMany({
      where,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
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
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error('Fuel entries fetch error:', error);
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

    const body = await request.json();
    const validated = createFuelEntrySchema.parse(body);

    // Verify truck belongs to company
    const truck = await prisma.truck.findFirst({
      where: {
        id: validated.truckId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!truck) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Truck not found' },
        },
        { status: 404 }
      );
    }

    // Verify MC number belongs to company if provided
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
            error: { code: 'NOT_FOUND', message: 'MC Number not found' },
          },
          { status: 404 }
        );
      }
    }

    const date = validated.date
      ? validated.date instanceof Date
        ? validated.date
        : new Date(validated.date)
      : new Date();

    // Generate unique fuel entry number
    const year = new Date().getFullYear();
    const count = await prisma.fuelEntry.count({
      where: {
        truck: { companyId: session.user.companyId },
      },
    });
    const fuelEntryNumber = `FUEL-${year}-${String(count + 1).padStart(3, '0')}`;

    const entry = await prisma.fuelEntry.create({
      data: {
        fuelEntryNumber,
        truckId: validated.truckId,
        driverId: validated.driverId,
        mcNumberId: validated.mcNumberId,
        gallons: validated.gallons,
        costPerGallon: validated.costPerGallon,
        totalCost: validated.totalCost,
        odometer: validated.odometer,
        location: validated.location,
        latitude: validated.latitude,
        longitude: validated.longitude,
        fuelType: validated.fuelType,
        receiptNumber: validated.receiptNumber,
        notes: validated.notes,
        date,
      },
      include: {
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: entry,
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

    console.error('Fuel entry creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

