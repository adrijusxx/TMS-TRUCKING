import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateTrailerSchema = z.object({
  trailerNumber: z.string().min(1).optional(),
  vin: z.string().optional().nullable(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  licensePlate: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  mcNumberId: z.string().min(1, 'MC number is required').optional(),
  type: z.string().optional().nullable(),
  ownership: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  assignedTruckId: z.string().cuid().optional().nullable(),
  operatorDriverId: z.string().cuid().optional().nullable(),
  status: z.string().optional().nullable(),
  fleetStatus: z.string().optional().nullable(),
  registrationExpiry: z.string().datetime().optional().nullable(),
  insuranceExpiry: z.string().datetime().optional().nullable(),
  inspectionExpiry: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const trailer = await prisma.trailer.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        assignedTruck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
          },
        },
        operatorDriver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        loads: {
          where: {
            status: {
              in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
            },
            deletedAt: null,
          },
          select: {
            id: true,
            loadNumber: true,
            status: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!trailer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trailer not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trailer,
    });
  } catch (error) {
    console.error('Trailer fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to edit trailers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit trailers',
          },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const existingTrailer = await prisma.trailer.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingTrailer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trailer not found' },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateTrailerSchema.parse(body);

    // Convert date strings to Date objects
    const updateData: any = { ...validated };
    if (validated.registrationExpiry !== undefined) {
      updateData.registrationExpiry = validated.registrationExpiry
        ? new Date(validated.registrationExpiry)
        : null;
    }
    if (validated.insuranceExpiry !== undefined) {
      updateData.insuranceExpiry = validated.insuranceExpiry
        ? new Date(validated.insuranceExpiry)
        : null;
    }
    if (validated.inspectionExpiry !== undefined) {
      updateData.inspectionExpiry = validated.inspectionExpiry
        ? new Date(validated.inspectionExpiry)
        : null;
    }

    const trailer = await prisma.trailer.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: trailer,
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

    console.error('Trailer update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to delete trailers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete trailers',
          },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const existingTrailer = await prisma.trailer.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingTrailer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trailer not found' },
        },
        { status: 404 }
      );
    }

    // Check if trailer has active loads
    const activeLoads = await prisma.load.count({
      where: {
        OR: [
          { trailerId: resolvedParams.id },
          { trailerNumber: existingTrailer.trailerNumber },
        ],
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
        deletedAt: null,
      },
    });

    if (activeLoads > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Cannot delete trailer with ${activeLoads} active load(s)`,
          },
        },
        { status: 409 }
      );
    }

    // Soft delete
    await prisma.trailer.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Trailer deleted successfully',
    });
  } catch (error: any) {
    console.error('Trailer delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete trailer',
        },
      },
      { status: 500 }
    );
  }
}

