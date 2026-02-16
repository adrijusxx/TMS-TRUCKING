import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateLoadSchema } from '@/lib/validations/load';
import { z } from 'zod';
import { notifyLoadStatusChanged, notifyLoadAssigned } from '@/lib/notifications/triggers';
import { hasPermission } from '@/lib/permissions';
import { LoadStatus } from '@prisma/client';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';
import { emitLoadStatusChanged, emitLoadAssigned, emitDispatchUpdated } from '@/lib/realtime/emitEvent';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';

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
            role: true,
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
      include: {
        documents: {
          where: { deletedAt: null },
          select: { type: true },
        },
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

    // Check Accounting Settings for validation strictness
    const accountingSettings = await prisma.accountingSettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    // CONDITIONAL VALIDATION: Only block if Strict Mode AND POD required
    const isStrictMode = accountingSettings?.settlementValidationMode === 'STRICT';
    const requirePod = accountingSettings?.requirePodUploaded ?? false;

    if (validated.status === 'DELIVERED' && existingLoad.status !== 'DELIVERED' && isStrictMode && requirePod) {
      const hasBOL = existingLoad.documents.some(d => d.type === 'BOL');
      const hasPOD = existingLoad.documents.some(d => d.type === 'POD');

      const missingDocs = [];
      if (!hasBOL) missingDocs.push('Bill of Lading (BOL)');
      if (!hasPOD) missingDocs.push('Proof of Delivery (POD)');

      if (missingDocs.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Cannot mark as Delivered. Missing documents: ${missingDocs.join(', ')}. Please upload them first.`,
            },
          },
          { status: 400 }
        );
      }
    }

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
          console.log('[Load Update DEBUG] Trailer validation failed:', {
            trailerId: validated.trailerId,
            companyId: session.user.companyId,
            found: false
          });
          const globalTrailer = await prisma.trailer.findUnique({ where: { id: validated.trailerId } });
          console.log('[Load Update DEBUG] Global trailer check:', globalTrailer ? {
            id: globalTrailer.id,
            companyId: globalTrailer.companyId,
            isDeleted: !!globalTrailer.deletedAt
          } : 'Not found globally');

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
          console.log('[Load Update DEBUG] Truck validation failed:', {
            truckId: validated.truckId,
            companyId: session.user.companyId,
            found: false
          });
          const globalTruck = await prisma.truck.findUnique({ where: { id: validated.truckId } });
          console.log('[Load Update DEBUG] Global truck check:', globalTruck ? {
            id: globalTruck.id,
            companyId: globalTruck.companyId,
            isDeleted: !!globalTruck.deletedAt
          } : 'Not found globally');

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
          console.log('[Load Update DEBUG] Driver validation failed:', {
            driverId: validated.driverId,
            companyId: session.user.companyId,
            found: false
          });
          // Also check if driver exists at all to verify ID
          const globalDriver = await prisma.driver.findUnique({ where: { id: validated.driverId } });
          console.log('[Load Update DEBUG] Global driver check:', globalDriver ? {
            id: globalDriver.id,
            companyId: globalDriver.companyId,
            isDeleted: !!globalDriver.deletedAt
          } : 'Not found globally');

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

    // Validate co-driver if provided
    if (validated.coDriverId !== undefined) {
      if (validated.coDriverId === null || validated.coDriverId === '') {
        updateData.coDriverId = null;
      } else {
        // Verify co-driver exists and belongs to company
        const coDriver = await prisma.driver.findFirst({
          where: {
            id: validated.coDriverId,
            companyId: session.user.companyId,
            deletedAt: null,
          },
        });
        if (!coDriver) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Co-driver not found or does not belong to your company',
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate dispatcher if provided
    if (validated.dispatcherId !== undefined) {
      if (validated.dispatcherId === null || validated.dispatcherId === '') {
        updateData.dispatcherId = null;
      } else {
        // Verify dispatcher exists and belongs to company
        const dispatcher = await prisma.user.findFirst({
          where: {
            id: validated.dispatcherId,
            companyId: session.user.companyId,
          },
        });
        if (!dispatcher) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Dispatcher not found or does not belong to your company',
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
    // Convert time window date strings to Date objects if provided
    if (validated.pickupTimeStart) {
      updateData.pickupTimeStart = validated.pickupTimeStart instanceof Date
        ? validated.pickupTimeStart
        : new Date(validated.pickupTimeStart);
    }
    if (validated.pickupTimeEnd) {
      updateData.pickupTimeEnd = validated.pickupTimeEnd instanceof Date
        ? validated.pickupTimeEnd
        : new Date(validated.pickupTimeEnd);
    }
    if (validated.deliveryTimeStart) {
      updateData.deliveryTimeStart = validated.deliveryTimeStart instanceof Date
        ? validated.deliveryTimeStart
        : new Date(validated.deliveryTimeStart);
    }
    if (validated.deliveryTimeEnd) {
      updateData.deliveryTimeEnd = validated.deliveryTimeEnd instanceof Date
        ? validated.deliveryTimeEnd
        : new Date(validated.deliveryTimeEnd);
    }

    // Track if driver was newly assigned or changed
    const wasDriverAssigned = !existingLoad.driverId && validated.driverId;
    const wasDriverChanged = existingLoad.driverId && validated.driverId && existingLoad.driverId !== validated.driverId;
    const oldStatus = existingLoad.status;
    const oldDispatchStatus = existingLoad.dispatchStatus;

    // Determine the driver ID we'll be working with
    const effectiveDriverId = validated.driverId !== undefined
      ? (validated.driverId || null)  // Use the new value if provided
      : existingLoad.driverId;  // Otherwise keep existing

    // Calculate driver pay if:
    // 1. Driver is being newly assigned or changed, OR
    // 2. driverPay is 0 and we have a driver assigned (fix missing pay), OR
    // 3. Pay-affecting fields changed and driverPay wasn't manually provided
    // 4. driverPay is explicitly set to null (triggering auto-recalculation)
    const currentDriverPay = validated.driverPay ?? existingLoad.driverPay ?? 0;
    const driverPayExplicitlyProvided = validated.driverPay !== undefined && validated.driverPay !== null && validated.driverPay > 0;

    const shouldRecalculatePay = effectiveDriverId && !driverPayExplicitlyProvided && (
      // New driver assigned or driver changed
      wasDriverAssigned || wasDriverChanged ||
      // Existing driver but pay is 0 - needs calculation
      (existingLoad.driverId && currentDriverPay === 0) ||
      // Explicit recalculation trigger
      validated.driverPay === null ||
      // Pay-affecting fields changed
      (validated.revenue !== undefined && validated.revenue !== existingLoad.revenue) ||
      (validated.totalMiles !== undefined && validated.totalMiles !== existingLoad.totalMiles) ||
      (validated.loadedMiles !== undefined && validated.loadedMiles !== existingLoad.loadedMiles) ||
      (validated.emptyMiles !== undefined && validated.emptyMiles !== existingLoad.emptyMiles)
    );

    if (shouldRecalculatePay && effectiveDriverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: effectiveDriverId },
        select: {
          payType: true,
          payRate: true,
        },
      });

      if (driver && driver.payType && driver.payRate !== null && driver.payRate !== undefined) {
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
        console.log(`[Load Update] Calculated driver pay: $${calculatedPay.toFixed(2)} for driver ${effectiveDriverId}`);
      } else {
        console.warn(`[Load Update] Driver ${effectiveDriverId} missing payType or payRate - cannot calculate driver pay`);
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

    // Variables for completion workflow results
    let completionResult: any = null;
    let completionWarnings: string[] = [];

    // Send notifications
    if (wasDriverAssigned && load.driverId) {
      await notifyLoadAssigned(load.id, load.driverId);
      // Emit real-time event
      emitLoadAssigned(load.id, load.driverId, load);
      emitDispatchUpdated({ type: 'load_assigned', loadId: load.id, driverId: load.driverId });
    }

    if (validated.status && validated.status !== oldStatus) {
      await notifyLoadStatusChanged(load.id, oldStatus, validated.status, session.user.id);
      // Emit real-time event
      emitLoadStatusChanged(load.id, validated.status, load);
      emitDispatchUpdated({ type: 'load_status_changed', loadId: load.id, status: validated.status });

      // CRITICAL: Trigger load completion workflow when status is DELIVERED or advanced
      const completionStatuses = ['DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL', 'BILLING_HOLD'];
      if (validated.status && completionStatuses.includes(validated.status)) {
        try {
          const completionManager = new LoadCompletionManager();
          completionResult = await completionManager.handleLoadCompletion(load.id);
          console.log(`[Load Update] Completion workflow triggered for load ${load.loadNumber}:`, completionResult);

          if (!completionResult.success && completionResult.errors) {
            completionWarnings = completionResult.errors;
          }
        } catch (completionError: any) {
          // Log but don't fail the request - load is already updated
          console.error(`[Load Update] Completion workflow failed for load ${load.loadNumber}:`, completionError.message);
          completionWarnings.push(`Completion workflow error: ${completionError.message}`);
        }
      }
    } else if (existingLoad.status === 'DELIVERED' && !validated.status) {
      // If status wasn't in the update payload, but we are editing a DELIVERED load,
      // we might want to ensure it's synced. For now, let's strictly require a status field or explicit triggers
      // to avoid overhead on every minor edit.
      // However, if the user explicitly saves "DELIVERED" again (validated.status === 'DELIVERED' above), it triggers.
    }

    return NextResponse.json({
      success: true,
      data: load,
      meta: {
        completionResult: completionResult || undefined,
        warnings: completionWarnings.length > 0 ? completionWarnings : undefined
      }
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

