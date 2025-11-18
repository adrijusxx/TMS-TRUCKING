import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateLoadSchema } from '@/lib/validations/load';
import { z } from 'zod';
import { notifyLoadStatusChanged, notifyLoadAssigned } from '@/lib/notifications/triggers';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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
    const resolvedParams = await Promise.resolve(params);
    const loadId = resolvedParams.id;

    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        customer: true,
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
        truck: true,
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
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
    const resolvedParams = await Promise.resolve(params);
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
            details: error.errors,
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
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
    const resolvedParams = await Promise.resolve(params);
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

