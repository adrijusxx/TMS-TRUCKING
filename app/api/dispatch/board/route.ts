import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Build MC filters - Load uses mcNumberId, Driver and Truck use mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const driverTruckFilter = await buildMcNumberIdWhereClause(session, request);

    // Get unassigned loads
    const unassignedLoads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        status: 'PENDING',
        deletedAt: null,
        pickupDate: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
      },
      orderBy: { pickupDate: 'asc' },
    });

    // Get assigned loads
    const assignedLoads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
        },
        deletedAt: null,
        pickupDate: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
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
      orderBy: { pickupDate: 'asc' },
    });

    // Get available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        ...driverTruckFilter,
        status: 'AVAILABLE',
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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
      orderBy: { driverNumber: 'asc' },
    });

    // Get available trucks
    const availableTrucks = await prisma.truck.findMany({
      where: {
        ...driverTruckFilter,
        status: 'AVAILABLE',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        truckNumber: true,
        equipmentType: true,
        currentLocation: true,
      },
      orderBy: { truckNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        unassignedLoads,
        assignedLoads,
        availableDrivers,
        availableTrucks,
      },
    });
  } catch (error) {
    console.error('Dispatch board error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

