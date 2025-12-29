import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';

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

    // Build MC filters - Load uses mcNumberId, Customer uses mcNumber string
    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const driverTruckFilter = await buildMcNumberIdWhereClause(session, request);
    
    // Convert for Customer (uses mcNumber string)
    const customerMcWhere = await convertMcNumberIdToMcNumberString(loadMcWhere);

    // Search loads (Load uses mcNumberId)
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        OR: [
          { loadNumber: { contains: query, mode: 'insensitive' } },
          { commodity: { contains: query, mode: 'insensitive' } },
          { pickupCity: { contains: query, mode: 'insensitive' } },
          { pickupState: { contains: query, mode: 'insensitive' } },
          { deliveryCity: { contains: query, mode: 'insensitive' } },
          { deliveryState: { contains: query, mode: 'insensitive' } },
          { customer: { name: { contains: query, mode: 'insensitive' } } },
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
        commodity: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
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
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        driverNumber: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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
          { make: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        truckNumber: true,
        make: true,
        model: true,
        year: true,
      },
      take: 5,
      orderBy: {
        truckNumber: 'asc',
      },
    });

    // Search customers (Customer uses mcNumber string)
    const customers = await prisma.customer.findMany({
      where: {
        ...customerMcWhere,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { customerNumber: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        customerNumber: true,
        city: true,
        state: true,
      },
      take: 5,
      orderBy: {
        name: 'asc',
      },
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

