import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateDriverSchema } from '@/lib/validations/driver';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            lastLogin: true,
          },
        },
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
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
          take: 5,
        },
        hosRecords: {
          orderBy: { date: 'desc' },
          take: 7,
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error('Driver fetch error:', error);
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
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingDriver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateDriverSchema.parse(body);

    const updateData: any = { ...validated };
    delete updateData.password;
    delete updateData.email;

    // Update user if needed
    if (validated.firstName || validated.lastName || validated.phone) {
      await prisma.user.update({
        where: { id: existingDriver.userId },
        data: {
          ...(validated.firstName && { firstName: validated.firstName }),
          ...(validated.lastName && { lastName: validated.lastName }),
          ...(validated.phone !== undefined && { phone: validated.phone }),
        },
      });
    }

    // Update password if provided
    if (validated.password) {
      const hashedPassword = await bcrypt.hash(validated.password, 10);
      await prisma.user.update({
        where: { id: existingDriver.userId },
        data: { password: hashedPassword },
      });
    }

    // Convert dates
    if (validated.licenseExpiry) {
      updateData.licenseExpiry = validated.licenseExpiry instanceof Date
        ? validated.licenseExpiry
        : new Date(validated.licenseExpiry);
    }
    if (validated.medicalCardExpiry) {
      updateData.medicalCardExpiry = validated.medicalCardExpiry instanceof Date
        ? validated.medicalCardExpiry
        : new Date(validated.medicalCardExpiry);
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
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
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: driver,
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

    console.error('Driver update error:', error);
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
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingDriver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    // Check permission to delete drivers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'drivers.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete drivers',
          },
        },
        { status: 403 }
      );
    }

    // Soft delete driver and user
    await Promise.all([
      prisma.driver.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      }),
      prisma.user.update({
        where: { id: existingDriver.userId },
        data: { deletedAt: new Date(), isActive: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    console.error('Driver deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

