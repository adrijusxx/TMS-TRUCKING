import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateTruckSchema } from '@/lib/validations/truck';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

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
    const truck = await prisma.truck.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        currentDrivers: {
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
        maintenanceRecords: {
          select: {
            id: true,
            type: true,
            description: true,
            cost: true,
            odometer: true,
            date: true,
            nextServiceDate: true,
            // status: true, // Removed until migration adds this column
            invoiceNumber: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
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

    return NextResponse.json({
      success: true,
      data: truck,
    });
  } catch (error) {
    console.error('Truck fetch error:', error);
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

    const resolvedParams = await params;
    const existingTruck = await prisma.truck.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingTruck) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Truck not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to edit trucks
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit trucks',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateTruckSchema.parse(body);

    const updateData: any = { ...validated };

    // Convert dates if provided
    if (validated.registrationExpiry) {
      updateData.registrationExpiry = validated.registrationExpiry instanceof Date
        ? validated.registrationExpiry
        : new Date(validated.registrationExpiry);
    }
    if (validated.insuranceExpiry) {
      updateData.insuranceExpiry = validated.insuranceExpiry instanceof Date
        ? validated.insuranceExpiry
        : new Date(validated.insuranceExpiry);
    }
    if (validated.inspectionExpiry) {
      updateData.inspectionExpiry = validated.inspectionExpiry instanceof Date
        ? validated.inspectionExpiry
        : new Date(validated.inspectionExpiry);
    }

    const truck = await prisma.truck.update({
      where: { id: resolvedParams.id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: truck,
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

    console.error('Truck update error:', error);
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

    const resolvedParams = await params;
    const existingTruck = await prisma.truck.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingTruck) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Truck not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to delete trucks
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete trucks',
          },
        },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.truck.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Truck deleted successfully',
    });
  } catch (error) {
    console.error('Truck deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

