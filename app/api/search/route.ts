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
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          loads: [],
          drivers: [],
          trucks: [],
          customers: [],
        },
      });
    }

    const searchTerm = `%${query}%`;

    // Build base filter with MC number if applicable
    // Load uses mcNumber (string), Driver and Truck use mcNumberId (relation)
    const loadFilter = await buildMcNumberWhereClause(session, request);
    const driverTruckFilter = await buildMcNumberIdWhereClause(session, request);

    // Search loads
    const loads = await prisma.load.findMany({
      where: {
        ...loadFilter,
        deletedAt: null,
        OR: [
          { loadNumber: { contains: query, mode: 'insensitive' } },
          { commodity: { contains: query, mode: 'insensitive' } },
          { pickupCity: { contains: query, mode: 'insensitive' } },
          { deliveryCity: { contains: query, mode: 'insensitive' } },
        ],
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
    });

    // Search drivers
    const drivers = await prisma.driver.findMany({
      where: {
        ...driverTruckFilter,
        deletedAt: null,
        OR: [
          { driverNumber: { contains: query, mode: 'insensitive' } },
          { user: { firstName: { contains: query, mode: 'insensitive' } } },
          { user: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
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
      take: 5,
    });

    // Search trucks
    const trucks = await prisma.truck.findMany({
      where: {
        ...driverTruckFilter,
        deletedAt: null,
        OR: [
          { truckNumber: { contains: query, mode: 'insensitive' } },
          { vin: { contains: query, mode: 'insensitive' } },
          { licensePlate: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        truckNumber: true,
        make: true,
        model: true,
      },
      take: 5,
    });

    // Search customers
    const customers = await prisma.customer.findMany({
      where: {
        ...loadFilter,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { customerNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        customerNumber: true,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        loads,
        drivers,
        trucks,
        customers,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

