import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get truck statistics
 */
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

    // Build where clause from filters
    // CRITICAL: Admins should see all trucks from ALL companies
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const where: any = {
      isActive: true,
      deletedAt: null,
    };
    
    // Only add companyId filter if NOT admin (admins see all companies)
    if (!isAdmin) {
      where.companyId = session.user.companyId;
    }

    // Apply filters
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      where.status = status;
    }

    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { truckNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get stats
    const [totalTrucks, availableTrucks, inUseTrucks, maintenanceTrucks] = await Promise.all([
      prisma.truck.count({ where }),
      prisma.truck.count({
        where: {
          ...where,
          status: 'AVAILABLE',
        },
      }),
      prisma.truck.count({
        where: {
          ...where,
          status: 'IN_USE',
        },
      }),
      prisma.truck.count({
        where: {
          ...where,
          status: 'MAINTENANCE',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalTrucks,
        availableTrucks,
        inUseTrucks,
        maintenanceTrucks,
      },
    });
  } catch (error) {
    console.error('Truck stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

