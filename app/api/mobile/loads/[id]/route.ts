import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ASSIGNED',
    'EN_ROUTE_PICKUP',
    'AT_PICKUP',
    'LOADED',
    'EN_ROUTE_DELIVERY',
    'AT_DELIVERY',
    'DELIVERED',
    'INVOICED',
    'PAID',
  ]),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * Get single load details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const load = await prisma.load.findFirst({
      where: {
        id: resolvedParams.id,
        driverId: driver.id,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Format for mobile
    const formattedLoad = {
      id: load.id,
      loadNumber: load.loadNumber,
      status: load.status,
      pickup: {
        city: load.pickupCity,
        state: load.pickupState,
        address: load.pickupAddress,
        date: load.pickupDate,
        timeWindow: load.pickupTimeStart && load.pickupTimeEnd 
          ? `${load.pickupTimeStart.toISOString()} - ${load.pickupTimeEnd.toISOString()}`
          : null,
        contact: load.pickupContact,
        phone: load.pickupPhone,
        latitude: null,
        longitude: null,
      },
      delivery: {
        city: load.deliveryCity,
        state: load.deliveryState,
        address: load.deliveryAddress,
        date: load.deliveryDate,
        timeWindow: load.deliveryTimeStart && load.deliveryTimeEnd
          ? `${load.deliveryTimeStart.toISOString()} - ${load.deliveryTimeEnd.toISOString()}`
          : null,
        contact: load.deliveryContact,
        phone: load.deliveryPhone,
        latitude: null,
        longitude: null,
      },
      customer: {
        name: load.customer.name,
        phone: load.customer.phone,
        email: load.customer.email,
        address: `${load.customer.address}, ${load.customer.city}, ${load.customer.state} ${load.customer.zip}`,
      },
      commodity: load.commodity,
      weight: load.weight,
      revenue: load.revenue,
      notes: load.dispatchNotes || null,
      statusHistory: load.statusHistory.map((h) => ({
        status: h.status,
        location: h.location,
        timestamp: h.createdAt,
        notes: h.notes,
      })),
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedLoad,
    });
  } catch (error) {
    console.error('Mobile load detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * Update load status (for driver mobile app)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    // Verify load belongs to driver
    const load = await prisma.load.findFirst({
      where: {
        id: resolvedParams.id,
        driverId: driver.id,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Update load status
    const updatedLoad = await prisma.load.update({
      where: { id: resolvedParams.id },
      data: {
        status: validated.status,
      },
    });

    // Create status history entry
    await prisma.loadStatusHistory.create({
      data: {
        loadId: resolvedParams.id,
        status: validated.status,
        location: validated.location || null,
        createdBy: session.user.id,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        notes: validated.notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedLoad.id,
        status: updatedLoad.status,
      },
    });
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

    console.error('Mobile load update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

