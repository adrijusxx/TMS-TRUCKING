import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/inspections/stats
 * Get inspection statistics
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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      inspectionDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all inspections in date range
    const inspections = await prisma.inspection.findMany({
      where,
      select: {
        id: true,
        status: true,
        oosStatus: true,
        defects: true,
        nextInspectionDue: true,
      },
    });

    // Calculate statistics
    const total = inspections.length;
    const passed = inspections.filter((i) => i.status === 'PASSED').length;
    const failed = inspections.filter((i) => i.status === 'FAILED').length;
    const outOfService = inspections.filter((i) => i.oosStatus || i.status === 'OUT_OF_SERVICE').length;
    const withDefects = inspections.filter((i) => i.defects > 0).length;

    // Count overdue inspections (nextInspectionDue is in the past)
    const now = new Date();
    const overdue = inspections.filter(
      (i) => i.nextInspectionDue && new Date(i.nextInspectionDue) < now
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        total,
        passed,
        failed,
        outOfService,
        overdue,
        withDefects,
      },
    });
  } catch (error: any) {
    console.error('Error fetching inspection stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch inspection stats',
        },
      },
      { status: 500 }
    );
  }
}

