import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDriverSchema } from '@/lib/validations/driver';
import bcrypt from 'bcryptjs';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getDriverFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { handleApiError } from '@/lib/api/route-helpers';
import { DriverQueryManager } from '@/lib/managers/DriverQueryManager';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'drivers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const mcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 500);
    const skip = (page - 1) * limit;
    const tab = searchParams.get('tab') || 'all';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const licenseState = searchParams.get('licenseState');
    const homeTerminal = searchParams.get('homeTerminal');
    const minRating = searchParams.get('minRating');
    const mcViewMode = searchParams.get('mc');
    const mcNumber = searchParams.get('mcNumber');
    const mcNumberIdFilter = searchParams.get('mcNumberId');
    const isActiveParam = searchParams.get('isActive');

    const roleFilter = await getDriverFilter(
      createFilterContext(session.user.id, session.user.role as any, session.user.companyId)
    );
    const includeDeleted = parseIncludeDeleted(request);
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

    const where: any = {
      ...mcWhere,
      ...roleFilter,
      ...(deletedFilter && { ...deletedFilter }),
    };

    // MC number filter overrides
    if (mcNumberIdFilter) {
      where.mcNumberId = mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned' ? null : mcNumberIdFilter;
    }

    // isActive filter
    if (isActiveParam === 'true') {
      where.isActive = true;
      where.employeeStatus = 'ACTIVE';
    } else if (isActiveParam === 'false') {
      where.isActive = false;
    }

    // MC number value filter
    if (mcNumber && mcViewMode !== 'all') {
      const mcRecord = await prisma.mcNumber.findFirst({
        where: { number: mcNumber.trim(), companyId: session.user.companyId },
        select: { id: true },
      });
      if (mcRecord) {
        const existingOR = where.OR || [];
        where.OR = [...existingOR, { mcNumberId: mcRecord.id }, { user: { mcNumberId: mcRecord.id } }];
      } else {
        const existingOR = where.OR || [];
        where.OR = [...existingOR, { mcNumber: { number: mcNumber.trim() } }];
      }
    }

    // Apply tab, status, search, and additional filters
    DriverQueryManager.applyTabFilter(where, tab, includeDeleted);
    if (status) DriverQueryManager.applyStatusFilter(where, status, includeDeleted);
    if (licenseState) where.licenseState = { contains: licenseState, mode: 'insensitive' };
    if (homeTerminal) where.homeTerminal = { contains: homeTerminal, mode: 'insensitive' };
    if (minRating) where.rating = { gte: parseFloat(minRating) };
    if (search) DriverQueryManager.applySearchFilter(where, search);

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        select: {
          id: true, driverNumber: true, licenseNumber: true, licenseState: true,
          licenseExpiry: true, medicalCardExpiry: true, drugTestDate: true,
          backgroundCheck: true, status: true, employeeStatus: true,
          assignmentStatus: true, dispatchStatus: true, driverType: true,
          deletedAt: true, isActive: true, mcNumberId: true,
          mcNumber: { select: { id: true, number: true, companyName: true } },
          teamDriver: true, payTo: true, warnings: true, notes: true,
          hireDate: true, terminationDate: true, driverTags: true,
          homeTerminal: true, emergencyContact: true, emergencyPhone: true,
          payType: true, payRate: true, escrowTargetAmount: true,
          escrowDeductionPerWeek: true, escrowBalance: true, rating: true,
          totalLoads: true, totalMiles: true, onTimePercentage: true,
          currentTruckId: true,
          currentTruck: { select: { id: true, truckNumber: true } },
          currentTrailerId: true,
          currentTrailer: { select: { id: true, trailerNumber: true } },
          _count: { select: { loads: { where: { deletedAt: null } } } },
          loads: {
            select: { status: true, revenue: true, driverPay: true, totalMiles: true, loadedMiles: true, emptyMiles: true },
            take: 100,
          },
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ]);

    const driversWithTariff = drivers.map(d => DriverQueryManager.transformListItem(d));
    const filteredDrivers = driversWithTariff.map(d => filterSensitiveFields(d, session.user.role as any));

    return NextResponse.json({
      success: true,
      data: filteredDrivers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'drivers.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to create drivers' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createDriverSchema.parse(body);

    if (role === 'DISPATCHER' && (validated.payType || validated.payRate)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Dispatchers cannot set pay rates when creating drivers.' } },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: validated.email.toLowerCase().trim(), companyId: session.user.companyId, deletedAt: null },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'User with this email already exists in this company' } },
        { status: 409 }
      );
    }

    const existingDriver = await prisma.driver.findFirst({
      where: { companyId: session.user.companyId, driverNumber: validated.driverNumber },
    });
    if (existingDriver) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Driver number already exists' } },
        { status: 409 }
      );
    }

    // Determine MC number
    const { McStateManager } = await import('@/lib/managers/McStateManager');
    let assignedMcNumberId: string | null = null;

    if (validated.mcNumberId) {
      if (await McStateManager.canAccessMc(session, validated.mcNumberId)) {
        const isValid = await prisma.mcNumber.count({
          where: { id: validated.mcNumberId, companyId: session.user.companyId, deletedAt: null },
        });
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_MC_NUMBER', message: 'MC number not found or does not belong to your company' } },
            { status: 400 }
          );
        }
        assignedMcNumberId = validated.mcNumberId;
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to the selected MC number' } },
          { status: 403 }
        );
      }
    } else {
      assignedMcNumberId = await McStateManager.determineActiveCreationMc(session, request);
      if (!assignedMcNumberId) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'MC number is required and no default could be determined.' } },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const licenseExpiry = validated.licenseExpiry instanceof Date ? validated.licenseExpiry : new Date(validated.licenseExpiry);
    const medicalCardExpiry = validated.medicalCardExpiry instanceof Date ? validated.medicalCardExpiry : new Date(validated.medicalCardExpiry);
    const toDate = (v: string | Date | undefined | null) =>
      v ? (v instanceof Date ? v : new Date(v)) : null;

    const user = await prisma.user.create({
      data: {
        email: validated.email, password: hashedPassword,
        tempPassword: validated.password,
        firstName: validated.firstName, lastName: validated.lastName, phone: validated.phone,
        role: 'DRIVER', companyId: session.user.companyId,
        mcNumberId: assignedMcNumberId, mcAccess: [assignedMcNumberId],
      },
    });

    const finalPayType = validated.payType ?? 'PER_MILE';
    const finalPayRate = (!validated.payRate || validated.payRate === 0) ? 0.65 : validated.payRate;

    const driver = await prisma.driver.create({
      data: {
        userId: user.id, companyId: session.user.companyId,
        driverNumber: validated.driverNumber, licenseNumber: validated.licenseNumber,
        licenseState: validated.licenseState, licenseExpiry, medicalCardExpiry,
        drugTestDate: toDate(validated.drugTestDate),
        backgroundCheck: toDate(validated.backgroundCheck),
        payType: finalPayType as any, payRate: finalPayRate,
        homeTerminal: validated.homeTerminal,
        emergencyContact: validated.emergencyContact || validated.emergencyContactName,
        emergencyPhone: validated.emergencyPhone || validated.emergencyContactPhone,
        mcNumberId: assignedMcNumberId, status: 'AVAILABLE',
        // Personal info
        socialSecurityNumber: validated.socialSecurityNumber,
        birthDate: toDate(validated.birthDate),
        gender: validated.gender as any,
        maritalStatus: validated.maritalStatus as any,
        localDriver: validated.localDriver,
        telegramNumber: validated.telegramNumber,
        // Address
        address1: validated.address1, address2: validated.address2,
        city: validated.city, state: validated.state,
        zipCode: validated.zipCode, country: validated.country,
        // Emergency contact (detailed)
        emergencyContactName: validated.emergencyContactName,
        emergencyContactRelation: validated.emergencyContactRelation,
        emergencyContactPhone: validated.emergencyContactPhone,
        emergencyContactEmail: validated.emergencyContactEmail,
        // Compliance
        licenseIssueDate: toDate(validated.licenseIssueDate),
        cdlExperience: validated.cdlExperience,
        restrictions: validated.restrictions,
        dlClass: validated.dlClass,
        driverType: validated.driverType as any,
        endorsements: validated.endorsements,
        driverFacingCamera: validated.driverFacingCamera,
        // Payroll
        stopPayEnabled: validated.stopPayEnabled,
        stopPayRate: validated.stopPayRate,
        payTo: validated.payTo, notes: validated.notes,
        escrowTargetAmount: validated.escrowTargetAmount,
        escrowDeductionPerWeek: validated.escrowDeductionPerWeek,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
