import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateDriverSchema } from '@/lib/validations/driver';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { hasPermission } from '@/lib/permissions';
import { 
  canWriteFinancialFields, 
  containsFinancialFields, 
  extractFinancialFields,
  removeFinancialFields 
} from '@/lib/utils/financial-access';

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

    // HR users should be able to access all drivers in the company
    // No need for MC number or role-based filtering for single driver fetch
    // Use findUnique for better performance and to ensure we get the exact driver
    const driver = await prisma.driver.findUnique({
      where: {
        id,
      },
      // Then verify companyId matches (for security)
      // This allows us to check companyId after fetching, which is more reliable
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            lastLogin: true,
            role: true,
            isActive: true,
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
        currentTrailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
        assignedDispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        hrManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        safetyManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        truckHistory: {
          include: {
            truck: {
              select: {
                id: true,
                truckNumber: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 50,
        },
        trailerHistory: {
          include: {
            trailer: {
              select: {
                id: true,
                trailerNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        comments: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
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
            revenue: true,
            driverPay: true,
            totalMiles: true,
            loadedMiles: true,
            emptyMiles: true,
          },
          take: 100,
        },
        hosRecords: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        company: {
          select: {
            id: true,
            name: true,
            mcNumber: true,
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
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

    // Verify the driver belongs to the user's company and is not deleted
    if (driver.companyId !== session.user.companyId || driver.deletedAt !== null) {
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
    console.log('[Driver Update API] Raw request body:', JSON.stringify(body, null, 2));
    console.log('[Driver Update API] recurringTransactions in body:', body.recurringTransactions);
    console.log('[Driver Update API] Type of recurringTransactions:', typeof body.recurringTransactions);
    console.log('[Driver Update API] Is array?', Array.isArray(body.recurringTransactions));
    
    const validated = updateDriverSchema.parse(body);
    console.log('[Driver Update API] Validated data - recurringTransactions:', validated.recurringTransactions);

    const role = session.user.role as 'ADMIN' | 'ACCOUNTANT' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';

    // Check if update contains financial fields
    const hasFinancialFields = containsFinancialFields(validated);
    
    if (hasFinancialFields && !canWriteFinancialFields(role)) {
      // Extract financial fields to show which ones are restricted
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
      'driverTariff', 'payTo', 'escrowTargetAmount', 'escrowDeductionPerWeek',
      'escrowBalance', 'warnings', 'licenseNumber', 'licenseState',
      'licenseExpiry', 'medicalCardExpiry', 'drugTestDate', 'backgroundCheck',
      'payType', 'payRate', 'homeTerminal', 'emergencyContact', 'emergencyPhone',
    ];

    driverFields.forEach((field) => {
      if (validated[field as keyof typeof validated] !== undefined) {
        const value = validated[field as keyof typeof validated];
        // Explicitly handle null values for nullable fields
        if (field === 'currentTruckId' || field === 'currentTrailerId') {
          updateData[field] = value === null || value === '' ? null : value;
        } else {
          updateData[field] = value;
        }
      }
    });

    // Handle unified recurring transactions (both additions and deductions) - save as DeductionRule records
    if (validated.recurringTransactions !== undefined) {
      console.log('[Driver Update] Processing recurring transactions:', validated.recurringTransactions);
      
      // Get driver number for naming pattern
      const driverIdentifier = existingDriver.driverNumber || id.slice(0, 8);
      console.log('[Driver Update] Driver identifier:', driverIdentifier);
      
      // Get existing deduction rules created for this driver (identified by name pattern)
      const existingRules = await prisma.deductionRule.findMany({
        where: {
          companyId: session.user.companyId,
          name: { startsWith: `Driver ${driverIdentifier} - ` },
        },
      });
      console.log('[Driver Update] Found existing rules:', existingRules.length);

      // Deactivate old rules (even if new list is empty)
      if (existingRules.length > 0) {
        await prisma.deductionRule.updateMany({
          where: {
            id: { in: existingRules.map(r => r.id) },
          },
          data: {
            isActive: false,
          },
        });
        console.log('[Driver Update] Deactivated', existingRules.length, 'old rules');
      }

      // Create new deduction rules for each recurring transaction
      if (Array.isArray(validated.recurringTransactions) && validated.recurringTransactions.length > 0) {
        console.log('[Driver Update] Creating', validated.recurringTransactions.length, 'new transaction rules');
        
        // Transaction types that are additions (payments to driver)
        const additionTypes = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'];
        
        // Map frontend transaction types to valid DeductionType enum values
        const mapTransactionTypeToDeductionType = (type: string): string => {
          const typeMap: Record<string, string> = {
            'LEASE': 'TRUCK_LEASE',
            'ELD': 'EQUIPMENT_RENTAL', // ELD not in DeductionType, map to EQUIPMENT_RENTAL
          };
          return typeMap[type] || type;
        };
        
        for (const transaction of validated.recurringTransactions) {
          if (transaction.type && transaction.amount > 0 && transaction.frequency) {
            const frequencyValue = transaction.frequency === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY';
            const isAddition = additionTypes.includes(transaction.type);
            const deductionType = mapTransactionTypeToDeductionType(transaction.type);
            
            try {
              const newRule = await prisma.deductionRule.create({
                data: {
                  companyId: session.user.companyId,
                  name: `Driver ${driverIdentifier} - ${transaction.type}${transaction.note ? ` (${transaction.note})` : ''}`,
                  deductionType: deductionType as any,
                  driverType: existingDriver.driverType as any,
                  isAddition: isAddition, // Set based on transaction type
                  calculationType: 'FIXED',
                  amount: transaction.amount,
                  frequency: frequencyValue as any, // DeductionRuleFrequency (WEEKLY or MONTHLY)
                  deductionFrequency: frequencyValue as any, // DeductionFrequency (WEEKLY or MONTHLY) - for settlement generation
                  notes: transaction.note || null,
                  isActive: true,
                },
              });
              console.log('[Driver Update] Created transaction rule:', newRule.id, newRule.name, 'isAddition:', isAddition, 'deductionType:', deductionType);
            } catch (error) {
              console.error('[Driver Update] Error creating transaction rule:', error);
            }
          } else {
            console.warn('[Driver Update] Skipping invalid transaction:', transaction);
          }
        }
      } else {
        console.log('[Driver Update] No transactions to create (empty array)');
      }
    } else {
      console.log('[Driver Update] recurringTransactions is undefined, skipping');
    }

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

    // Handle truck and trailer assignment changes with history tracking
    const oldTruckId = existingDriver.currentTruckId;
    const oldTrailerId = existingDriver.currentTrailerId;
    const newTruckId = updateData.currentTruckId !== undefined ? updateData.currentTruckId : oldTruckId;
    const newTrailerId = updateData.currentTrailerId !== undefined ? updateData.currentTrailerId : oldTrailerId;

    // Create truck history if truck changed
    if (updateData.currentTruckId !== undefined && oldTruckId !== newTruckId) {
      const now = new Date();
      
      // Close old truck assignment if it existed
      if (oldTruckId) {
        await prisma.driverTruckHistory.updateMany({
          where: {
            driverId: id,
            truckId: oldTruckId,
            dropOffDate: null, // Only update active assignments
          },
          data: {
            dropOffDate: now,
            isActive: false,
          },
        });
      }

      // Create new truck assignment history
      if (newTruckId) {
        await prisma.driverTruckHistory.create({
          data: {
            driverId: id,
            truckId: newTruckId,
            date: now,
            pickupDate: now,
            isActive: true,
            note: 'Assignment updated',
          },
        });
      }

      // Auto-split loads if truck changed
      const { LoadSplitManager } = await import('@/lib/managers/LoadSplitManager');
      try {
        await LoadSplitManager.autoSplitOnTruckChange({
          driverId: id,
          oldTruckId: oldTruckId || undefined,
          newTruckId: newTruckId || undefined,
          changeDate: now,
        });
      } catch (splitError) {
        console.error('Auto-split error on truck change:', splitError);
        // Don't fail the update if auto-split fails, just log it
      }
    }

    // Create trailer history if trailer changed
    if (updateData.currentTrailerId !== undefined && oldTrailerId !== newTrailerId) {
      const now = new Date();
      
      // Close old trailer assignment if it existed
      if (oldTrailerId) {
        await prisma.driverTrailerHistory.updateMany({
          where: {
            driverId: id,
            trailerId: oldTrailerId,
            dropOffDate: null, // Only update active assignments
          },
          data: {
            dropOffDate: now,
          },
        });
      }

      // Create new trailer assignment history
      if (newTrailerId) {
        await prisma.driverTrailerHistory.create({
          data: {
            driverId: id,
            trailerId: newTrailerId,
            pickupDate: now,
          },
        });
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

