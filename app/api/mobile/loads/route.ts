import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get loads assigned to the authenticated driver
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get driver for this user
    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      driverId: driver.id,
      companyId: driver.companyId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    // Fetch loads
    const loads = await prisma.load.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        pickupDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Format for mobile
    const formattedLoads = loads.map((load) => ({
      id: load.id,
      loadNumber: load.loadNumber,
      status: load.status,
      pickup: {
        city: load.pickupCity,
        state: load.pickupState,
        address: load.pickupAddress,
        date: load.pickupDate,
        timeWindow: load.pickupTimeStart && load.pickupTimeEnd 
          ? `${load.pickupTimeStart.toISOString()} - ${load.pickupTimeEnd.toISOString()}`
          : null,
        contact: load.pickupContact,
        phone: load.pickupPhone,
        latitude: null,
        longitude: null,
      },
      delivery: {
        city: load.deliveryCity,
        state: load.deliveryState,
        address: load.deliveryAddress,
        date: load.deliveryDate,
        timeWindow: load.deliveryTimeStart && load.deliveryTimeEnd
          ? `${load.deliveryTimeStart.toISOString()} - ${load.deliveryTimeEnd.toISOString()}`
          : null,
        contact: load.deliveryContact,
        phone: load.deliveryPhone,
        latitude: null,
        longitude: null,
      },
      customer: {
        name: load.customer.name,
        phone: load.customer.phone,
        email: load.customer.email,
      },
      commodity: load.commodity,
      weight: load.weight,
      revenue: load.revenue,
      notes: load.dispatchNotes || null,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        loads: formattedLoads,
        total: loads.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Mobile loads error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

