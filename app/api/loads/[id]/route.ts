import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateLoadSchema } from '@/lib/validations/load';
import { z } from 'zod';
import { notifyLoadStatusChanged, notifyLoadAssigned } from '@/lib/notifications/triggers';
import { hasPermission } from '@/lib/permissions';
import { LoadStatus } from '@prisma/client';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';

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
    const loadId = resolvedParams.id;

    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            creditLimit: true,
            creditHold: true,
            paymentTerms: true,
            mcNumber: true,
          },
        },
        driver: {
          include: {
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
        coDriver: {
          include: {
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
        truck: true,
        trailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
          orderBy: { sequence: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        segments: {
          orderBy: { sequence: 'asc' },
          include: {
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
            truck: {
              select: {
                id: true,
                truckNumber: true,
              },
            },
          },
        },
        rateConfirmation: {
          select: {
            id: true,
            rateConfNumber: true,
            baseRate: true,
            fuelSurcharge: true,
            accessorialCharges: true,
            totalRate: true,
            paymentTerms: true,
            paymentMethod: true,
            notes: true,
          },
        },
        loadExpenses: {
          orderBy: { date: 'desc' },
        },
        accessorialCharges: true,
        driverAdvances: {
          orderBy: { requestDate: 'desc' },
        },
        route: true,
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

    return NextResponse.json({
      success: true,
      data: load,
    });
  } catch (error) {
    console.error('Load fetch error:', error);
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

    // Handle Next.js 15+ params which can be a Promise
    const resolvedParams = await params;
    const loadId = resolvedParams.id;

    // Verify load exists and belongs to company
    const existingLoad = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingLoad) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to edit loads
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'loads.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit loads',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateLoadSchema.parse(body);

    // Prepare update data
    const updateData: any = { ...validated };

    // Validate foreign key relationships if IDs are provided
    if (validated.trailerId !== undefined) {
      if (validated.trailerId === null || validated.trailerId === '') {
        // Convert empty string to null
        updateData.trailerId = null;
      } else {
        // Verify trailer exists and belongs to company
        const trailer = await prisma.trailer.findFirst({
          where: {
            id: validated.trailerId,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
        if (!trailer) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Trailer not found or does not belong to your company',
              },
            },
            { status: 400 }
          );
        }
      }
    }

    if (validated.truckId !== undefined) {
      if (validated.truckId === null || validated.truckId === '') {
        updateData.truckId = null;
      } else {
        // Verify truck exists and belongs to company
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
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Truck not found or does not belong to your company',
              },
            },
            { status: 400 }
          );
        }
      }
    }

    if (validated.driverId !== undefined) {
      if (validated.driverId === null || validated.driverId === '') {
        updateData.driverId = null;
      } else {
        // Verify driver exists and belongs to company
        const driver = await prisma.driver.findFirst({
          where: {
            id: validated.driverId,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
        if (!driver) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Driver not found or does not belong to your company',
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Convert date strings to Date objects if provided
    if (validated.pickupDate) {
      updateData.pickupDate = validated.pickupDate instanceof Date
        ? validated.pickupDate
        : new Date(validated.pickupDate);
    }
    if (validated.deliveryDate) {
      updateData.deliveryDate = validated.deliveryDate instanceof Date
        ? validated.deliveryDate
        : new Date(validated.deliveryDate);
    }

    // Track if driver was newly assigned
    const wasDriverAssigned = !existingLoad.driverId && validated.driverId;
    const oldStatus = existingLoad.status;
    const oldDispatchStatus = existingLoad.dispatchStatus;

    // Calculate driver pay if driver is being assigned and driverPay is not manually set
    if (wasDriverAssigned && validated.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: validated.driverId },
        select: {
          payType: true,
          payRate: true,
        },
      });

      if (driver && (!validated.driverPay || validated.driverPay === 0)) {
        const calculatedPay = calculateDriverPay(
          {
            payType: driver.payType,
            payRate: driver.payRate,
          },
          {
            totalMiles: validated.totalMiles ?? existingLoad.totalMiles,
            loadedMiles: validated.loadedMiles ?? existingLoad.loadedMiles,
            emptyMiles: validated.emptyMiles ?? existingLoad.emptyMiles,
            revenue: validated.revenue ?? existingLoad.revenue,
          }
        );
        updateData.driverPay = calculatedPay;
      }
    }

    // Create status history entry if status changed
    if (validated.status && validated.status !== existingLoad.status) {
      await prisma.loadStatusHistory.create({
        data: {
          loadId: loadId,
          status: validated.status as any,
          createdBy: session.user.id,
          notes: `Status changed from ${existingLoad.status} to ${validated.status}`,
        },
      });
    }

    // Create status history entry if dispatch status changed
    if (validated.dispatchStatus && validated.dispatchStatus !== existingLoad.dispatchStatus) {
      await prisma.loadStatusHistory.create({
        data: {
          loadId: loadId,
          status: existingLoad.status, // Keep the main status
          createdBy: session.user.id,
          notes: `Dispatch status changed from ${existingLoad.dispatchStatus || 'none'} to ${validated.dispatchStatus}`,
        },
      });
    }

    const load = await prisma.load.update({
      where: { id: loadId },
      data: updateData,
      include: {
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
      },
    });

    // Send notifications
    if (wasDriverAssigned && load.driverId) {
      await notifyLoadAssigned(load.id, load.driverId);
    }

    if (validated.status && validated.status !== oldStatus) {
      await notifyLoadStatusChanged(load.id, oldStatus, validated.status, session.user.id);
    }

    return NextResponse.json({
      success: true,
      data: load,
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

    console.error('Load update error:', error);
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

    // Handle Next.js 15+ params which can be a Promise
    const resolvedParams = await params;
    const loadId = resolvedParams.id;

    // Verify load exists and belongs to company
    const existingLoad = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingLoad) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to delete loads
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'loads.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete loads',
          },
        },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.load.update({
      where: { id: loadId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Load deleted successfully',
    });
  } catch (error) {
    console.error('Load deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

