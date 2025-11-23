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

    const updateData: any = {};
    
    // Driver-specific fields
    const driverFields = [
      'status', 'employeeStatus', 'assignmentStatus', 'dispatchStatus',
      'currentTruckId', 'currentTrailerId', 'socialSecurityNumber',
      'birthDate', 'hireDate', 'terminationDate', 'tenure', 'gender',
      'maritalStatus', 'localDriver', 'telegramNumber', 'thresholdAmount',
      'licenseIssueDate', 'cdlExperience', 'restrictions', 'dlClass',
      'driverType', 'endorsements', 'driverFacingCamera', 'address1',
      'address2', 'city', 'state', 'zipCode', 'country', 'dispatchPreferences',
      'assignedDispatcherId', 'hrManagerId', 'safetyManagerId', 'mcNumber',
      'teamDriver', 'otherId', 'driverTags', 'notes', 'emergencyContactName',
      'emergencyContactRelation', 'emergencyContactAddress1', 'emergencyContactAddress2',
      'emergencyContactCity', 'emergencyContactState', 'emergencyContactZip',
      'emergencyContactCountry', 'emergencyContactPhone', 'emergencyContactEmail',
      'driverTariff', 'payTo', 'warnings', 'licenseNumber', 'licenseState',
      'licenseExpiry', 'medicalCardExpiry', 'drugTestDate', 'backgroundCheck',
      'payType', 'payRate', 'homeTerminal', 'emergencyContact', 'emergencyPhone',
    ];

    driverFields.forEach((field) => {
      if (validated[field as keyof typeof validated] !== undefined) {
        updateData[field] = validated[field as keyof typeof validated];
      }
    });

    // Convert date strings to Date objects
    const dateFields = [
      'licenseExpiry', 'medicalCardExpiry', 'drugTestDate', 'backgroundCheck',
      'birthDate', 'hireDate', 'terminationDate', 'licenseIssueDate',
    ];
    
    dateFields.forEach((field) => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        updateData[field] = new Date(updateData[field]);
      }
    });

    // Detect truck change and auto-split loads
    if (updateData.currentTruckId !== undefined && updateData.currentTruckId !== existingDriver.currentTruckId) {
      const { LoadSplitManager } = await import('@/lib/managers/LoadSplitManager');
      
      try {
        await LoadSplitManager.autoSplitOnTruckChange({
          driverId: id,
          oldTruckId: existingDriver.currentTruckId || undefined,
          newTruckId: updateData.currentTruckId || undefined,
          changeDate: new Date(),
        });
      } catch (splitError) {
        console.error('Auto-split error on truck change:', splitError);
        // Don't fail the update if auto-split fails, just log it
      }
    }

    // Recalculate driver tariff if payType or payRate changed
    if (updateData.payType !== undefined || updateData.payRate !== undefined) {
      const { calculateDriverTariff } = await import('@/lib/utils/driverTariff');
      const finalPayType = updateData.payType || existingDriver.payType;
      const finalPayRate = updateData.payRate || existingDriver.payRate;
      
      // Get driver's loads for tariff calculation
      const driverLoads = await prisma.load.findMany({
        where: {
          driverId: id,
          deletedAt: null,
        },
        select: {
          revenue: true,
          driverPay: true,
          totalMiles: true,
          loadedMiles: true,
          emptyMiles: true,
          serviceFee: true,
        },
        take: 100,
      });

      const tariff = calculateDriverTariff({
        payType: finalPayType,
        payRate: finalPayRate,
        loads: driverLoads,
      });
      updateData.driverTariff = tariff;
    }

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

