import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';


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

    // Build Broad Access Filters (Ignore "Current View")
    const { McStateManager } = await import('@/lib/managers/McStateManager');

    // Get fresh access list
    const userId = session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    const mcAccess = await McStateManager.getMcAccessFromDb(userId);
    const companyId = session.user.companyId;

    // Determine the "Broadest Possible" filter for this user
    let broadFilter: any = { companyId };

    // If not a full admin, restrict to assigned MCs
    // Full Admin (isAdmin && mcAccess.length === 0) -> No extra filter (sees all)
    if (!(isAdmin && mcAccess.length === 0)) {
      if (mcAccess.length > 0) {
        broadFilter.OR = [
          { mcNumberId: { in: mcAccess } },
          { mcNumberId: null } // Include items with no MC assigned
        ];
      } else {
        // User has NO access? (Shouldn't happen for active users usually, but handle it)
        // If they have no MC access and aren't full admin, they likely shouldn't see anything sensitive.
        // But let's assume they can see things with mcNumberId=null at least?
        // Or maybe they should see nothing?
        // Let's stick to the pattern:
        broadFilter.mcNumberId = { in: [] }; // No results
      }
    }

    // Use this broad filter for queries
    const loadMcWhere = broadFilter;
    const driverTruckFilter = broadFilter;

    // Convert for Customer (uses mcNumber string)
    // We need to fetch the actual numbers for the IDs in mcAccess
    let customerMcWhere: any = { companyId };
    if (!(isAdmin && mcAccess.length === 0)) {
      if (mcAccess.length > 0) {
        const mcNumbers = await McStateManager.getMcNumberValues(mcAccess);
        if (mcNumbers.length > 0) {
          customerMcWhere.OR = [
            { mcNumber: { in: mcNumbers } },
            { mcNumber: null }
          ];
        } else {
          customerMcWhere.mcNumber = { in: [] };
        }
      } else {
        customerMcWhere.mcNumber = { in: [] };
      }
    }

    console.log(`[GlobalSearch] Query: "${query}" | User: ${session.user.email} (${session.user.role}) | Company: ${companyId}`);
    console.log(`[GlobalSearch] Broad Filter:`, JSON.stringify(broadFilter, null, 2));
    console.log(`[GlobalSearch] Customer Filter:`, JSON.stringify(customerMcWhere, null, 2));
    console.log('[GlobalSearch] Broad Filters Applied:', { role: session.user.role, mcAccessLen: mcAccess.length });

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
    console.log(`[GlobalSearch] Found ${loads.length} loads`);

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
    console.log(`[GlobalSearch] Found ${drivers.length} drivers`);

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
    console.log(`[GlobalSearch] Found ${trucks.length} trucks`);

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
    console.log(`[GlobalSearch] Found ${customers.length} customers`);

    return NextResponse.json({
      success: true,
      data: {
        loads,
        drivers,
        trucks,
        trailers: [], // Trailers not implemented in search yet?
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

