import { prisma } from '@/lib/prisma';
import { LoadStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fields that map directly from the update schema to the driver model */
const DRIVER_FIELDS = [
  'status', 'employeeStatus', 'assignmentStatus', 'dispatchStatus',
  'currentTruckId', 'currentTrailerId', 'socialSecurityNumber',
  'birthDate', 'hireDate', 'terminationDate', 'tenure', 'gender',
  'maritalStatus', 'localDriver', 'telegramNumber', 'thresholdAmount',
  'licenseIssueDate', 'cdlExperience', 'restrictions', 'dlClass',
  'driverType', 'endorsements', 'driverFacingCamera', 'address1',
  'address2', 'city', 'state', 'zipCode', 'country', 'dispatchPreferences',
  'assignedDispatcherId', 'hrManagerId', 'safetyManagerId', 'mcNumberId',
  'teamDriver', 'otherId', 'notes', 'emergencyContactName',
  'emergencyContactRelation', 'emergencyContactAddress1', 'emergencyContactAddress2',
  'emergencyContactCity', 'emergencyContactState', 'emergencyContactZip',
  'emergencyContactCountry', 'emergencyContactPhone', 'emergencyContactEmail',
  'payTo', 'escrowTargetAmount', 'escrowDeductionPerWeek',
  'escrowBalance', 'warnings', 'licenseNumber', 'licenseState',
  'licenseExpiry', 'medicalCardExpiry', 'drugTestDate', 'backgroundCheck',
  'payType', 'payRate', 'stopPayEnabled', 'stopPayRate',
  'homeTerminal', 'emergencyContact', 'emergencyPhone',
];

const DATE_FIELDS = [
  'licenseExpiry', 'medicalCardExpiry', 'drugTestDate', 'backgroundCheck',
  'birthDate', 'hireDate', 'terminationDate', 'licenseIssueDate',
];

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/**
 * DriverQueryManager - handles complex driver update logic including:
 * - Building update data from validated input
 * - Truck/trailer assignment history tracking
 * - User account synchronization
 */
export class DriverQueryManager {

  /** Build the Prisma update data object from validated input */
  static buildUpdateData(validated: any): Record<string, any> {
    const updateData: any = {};

    DRIVER_FIELDS.forEach(field => {
      if (validated[field] !== undefined) {
        const value = validated[field];
        if (field === 'currentTruckId' || field === 'currentTrailerId') {
          updateData[field] = value === null || value === '' ? null : value;
        } else {
          updateData[field] = value;
        }
      }
    });

    // Map schema field 'tags' -> Prisma field 'driverTags'
    if (validated.tags !== undefined) {
      updateData.driverTags = validated.tags;
    }

    // Convert date strings to Date objects
    DATE_FIELDS.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        updateData[field] = new Date(updateData[field]);
      }
    });

    return updateData;
  }

  /** Track truck assignment changes with history */
  static async trackTruckChange(
    driverId: string,
    oldTruckId: string | null,
    newTruckId: string | null,
  ): Promise<void> {
    if (oldTruckId === newTruckId) return;

    const now = new Date();

    if (oldTruckId) {
      await prisma.driverTruckHistory.updateMany({
        where: { driverId, truckId: oldTruckId, dropOffDate: null },
        data: { dropOffDate: now, isActive: false },
      });
    }

    if (newTruckId) {
      await prisma.driverTruckHistory.create({
        data: { driverId, truckId: newTruckId, date: now, pickupDate: now, isActive: true, note: 'Assignment updated' },
      });
    }

    // Auto-split loads on truck change
    try {
      const { LoadSplitManager } = await import('@/lib/managers/LoadSplitManager');
      await LoadSplitManager.autoSplitOnTruckChange({
        driverId,
        oldTruckId: oldTruckId || undefined,
        newTruckId: newTruckId || undefined,
        changeDate: now,
      });
    } catch (err: any) {
      logger.error('Auto-split error on truck change', { error: err?.message });
    }
  }

  /** Track trailer assignment changes with history */
  static async trackTrailerChange(
    driverId: string,
    oldTrailerId: string | null,
    newTrailerId: string | null,
  ): Promise<void> {
    if (oldTrailerId === newTrailerId) return;

    const now = new Date();

    if (oldTrailerId) {
      await prisma.driverTrailerHistory.updateMany({
        where: { driverId, trailerId: oldTrailerId, dropOffDate: null },
        data: { dropOffDate: now },
      });
    }

    if (newTrailerId) {
      await prisma.driverTrailerHistory.create({
        data: { driverId, trailerId: newTrailerId, pickupDate: now },
      });
    }
  }

  /** Sync linked user account fields */
  static async syncUserAccount(
    userId: string,
    validated: any,
  ): Promise<void> {
    if (!userId) return;

    if (validated.firstName || validated.lastName || validated.phone !== undefined || validated.mcNumberId !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(validated.firstName && { firstName: validated.firstName }),
          ...(validated.lastName && { lastName: validated.lastName }),
          ...(validated.phone !== undefined && { phone: validated.phone }),
          ...(validated.mcNumberId !== undefined && { mcNumberId: validated.mcNumberId }),
        },
      });
    }

    if (validated.password) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(validated.password, 10);
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          ...(validated.tempPassword && { tempPassword: validated.tempPassword }),
        },
      });
    }
  }

  /** Apply tab-based filtering to the where clause */
  static applyTabFilter(where: any, tab: string, includeDeleted: boolean): void {
    if (!includeDeleted) {
      switch (tab) {
        case 'active':
          where.isActive = true;
          where.employeeStatus = 'ACTIVE';
          break;
        case 'unassigned':
          where.isActive = true;
          where.employeeStatus = 'ACTIVE';
          where.currentTruckId = null;
          break;
        case 'terminated':
          where.employeeStatus = 'TERMINATED';
          break;
        case 'vacation':
          where.isActive = true;
          where.status = 'ON_LEAVE';
          break;
      }
    } else {
      if (tab === 'unassigned') where.currentTruckId = null;
      if (tab === 'vacation') where.status = 'ON_LEAVE';
    }
  }

  /** Apply status filter with ACTIVE -> employeeStatus mapping */
  static applyStatusFilter(where: any, status: string, includeDeleted: boolean): void {
    const validStatuses = [
      'AVAILABLE', 'ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH',
      'ON_LEAVE', 'INACTIVE', 'IN_TRANSIT', 'DISPATCHED',
    ];
    if (validStatuses.includes(status)) {
      where.status = status;
    } else if (status === 'ACTIVE' && !includeDeleted) {
      where.employeeStatus = 'ACTIVE';
      where.isActive = true;
      delete where.status;
    }
    // Final safeguard
    if (where.status === 'ACTIVE' && !includeDeleted) {
      delete where.status;
      where.employeeStatus = 'ACTIVE';
      where.isActive = true;
    }
  }

  /** Apply search conditions, merging with existing OR (e.g. MC filter) */
  static applySearchFilter(where: any, search: string): void {
    const searchConditions = [
      { driverNumber: { contains: search, mode: 'insensitive' } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search, mode: 'insensitive' } } },
      { currentTruck: { truckNumber: { contains: search, mode: 'insensitive' } } },
      { currentTrailer: { trailerNumber: { contains: search, mode: 'insensitive' } } },
      { homeTerminal: { contains: search, mode: 'insensitive' } },
    ];

    if (where.OR && Array.isArray(where.OR)) {
      where.AND = [{ OR: [...where.OR] }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  /** Transform raw driver rows into the list API response format */
  static transformListItem(driver: any): any {
    const activeStatuses = new Set([
      'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY',
    ]);

    const liveLoadCount = driver._count?.loads ?? driver.totalLoads;
    const activeLoadCount = driver.loads?.filter((l: any) => activeStatuses.has(l.status)).length ?? 0;

    return {
      ...driver,
      firstName: driver.user?.firstName ?? '',
      lastName: driver.user?.lastName ?? '',
      email: driver.user?.email ?? '',
      phone: driver.user?.phone ?? null,
      truck: driver.currentTruck,
      trailer: driver.currentTrailer,
      tags: driver.driverTags || [],
      userId: driver.user?.id ?? null,
      currentTruckId: driver.currentTruckId,
      currentTrailerId: driver.currentTrailerId,
      mcNumberId: driver.mcNumberId || null,
      liveLoadCount,
      activeLoadCount,
    };
  }

  /** The single-driver GET include clause */
  static readonly singleDriverInclude = {
    user: {
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, lastLogin: true, role: true, isActive: true, tempPassword: true },
    },
    currentTruck: { select: { id: true, truckNumber: true, make: true, model: true } },
    currentTrailer: { select: { id: true, trailerNumber: true } },
    assignedDispatcher: { select: { id: true, firstName: true, lastName: true } },
    hrManager: { select: { id: true, firstName: true, lastName: true } },
    safetyManager: { select: { id: true, firstName: true, lastName: true } },
    truckHistory: {
      include: { truck: { select: { id: true, truckNumber: true } } },
      orderBy: { date: 'desc' as const }, take: 50,
    },
    trailerHistory: {
      include: { trailer: { select: { id: true, trailerNumber: true } } },
      orderBy: { createdAt: 'desc' as const }, take: 50,
    },
    comments: {
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' as const }, take: 50,
    },
    loads: {
      where: {
        status: { in: [LoadStatus.ASSIGNED, LoadStatus.EN_ROUTE_PICKUP, LoadStatus.LOADED, LoadStatus.EN_ROUTE_DELIVERY] },
        deletedAt: null,
      },
      select: {
        id: true, loadNumber: true, status: true,
        pickupCity: true, pickupState: true, deliveryCity: true, deliveryState: true,
        revenue: true, driverPay: true, totalMiles: true, loadedMiles: true, emptyMiles: true,
      },
      take: 100,
    },
    hosRecords: { orderBy: { date: 'desc' as const }, take: 7 },
    company: { select: { id: true, name: true, mcNumber: true } },
    mcNumber: { select: { id: true, number: true, companyName: true } },
  };
}
