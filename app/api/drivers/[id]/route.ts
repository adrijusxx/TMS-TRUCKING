import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateDriverSchema } from '@/lib/validations/driver';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import {
  canWriteFinancialFields,
  containsFinancialFields,
  extractFinancialFields,
} from '@/lib/utils/financial-access';
import { DriverQueryManager } from '@/lib/managers/DriverQueryManager';

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

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: DriverQueryManager.singleDriverInclude,
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
        { status: 404 }
      );
    }

    // Verify the driver belongs to the user's company and is not deleted
    if (driver.companyId !== session.user.companyId || driver.deletedAt !== null) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error('Driver fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
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
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateDriverSchema.parse(body);
    const role = session.user.role as 'ADMIN' | 'ACCOUNTANT' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';

    // Check financial field permissions
    if (containsFinancialFields(validated) && !canWriteFinancialFields(role)) {
      const financialFields = extractFinancialFields(validated);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators and accountants can modify financial/payroll fields',
            restrictedFields: Object.keys(financialFields),
          },
        },
        { status: 403 }
      );
    }

    // Build update data
    const updateData = DriverQueryManager.buildUpdateData(validated);

    // Process recurring transactions
    await DriverQueryManager.processRecurringTransactions({
      driverId: id,
      companyId: session.user.companyId,
      existingDriver,
      validated,
    });

    // Track truck/trailer assignment changes
    const oldTruckId = existingDriver.currentTruckId;
    const oldTrailerId = existingDriver.currentTrailerId;
    const newTruckId = updateData.currentTruckId !== undefined ? updateData.currentTruckId : oldTruckId;
    const newTrailerId = updateData.currentTrailerId !== undefined ? updateData.currentTrailerId : oldTrailerId;

    if (updateData.currentTruckId !== undefined && oldTruckId !== newTruckId) {
      await DriverQueryManager.trackTruckChange(id, oldTruckId, newTruckId);
    }

    if (updateData.currentTrailerId !== undefined && oldTrailerId !== newTrailerId) {
      await DriverQueryManager.trackTrailerChange(id, oldTrailerId, newTrailerId);
    }

    // Sync linked user account
    if (existingDriver.userId) {
      await DriverQueryManager.syncUserAccount(existingDriver.userId, validated);
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        currentTruck: { select: { id: true, truckNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Driver update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
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
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
        { status: 404 }
      );
    }

    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'drivers.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to delete drivers' } },
        { status: 403 }
      );
    }

    const deleteOps = [
      prisma.driver.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }),
    ];

    if (existingDriver.userId) {
      deleteOps.push(
        prisma.user.update({
          where: { id: existingDriver.userId },
          data: { deletedAt: new Date(), isActive: false },
        }) as any
      );
    }

    await Promise.all(deleteOps);

    return NextResponse.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Driver deletion error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
