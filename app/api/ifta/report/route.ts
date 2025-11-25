import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { IFTAManager } from '@/lib/managers/IFTAManager';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Build MC filter for loads
    const mcWhere = await buildMcNumberWhereClause(session, request);
    // Extract MC number ID(s) - can be string or array
    let mcNumberId: string | string[] | undefined;
    if (mcWhere.mcNumberId) {
      if (typeof mcWhere.mcNumberId === 'string') {
        mcNumberId = mcWhere.mcNumberId;
      } else if (Array.isArray(mcWhere.mcNumberId)) {
        mcNumberId = mcWhere.mcNumberId;
      } else if (mcWhere.mcNumberId.in && Array.isArray(mcWhere.mcNumberId.in)) {
        mcNumberId = mcWhere.mcNumberId.in;
      }
    }

    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') as 'QUARTER' | 'MONTH' | null;
    const periodYear = searchParams.get('periodYear');
    const periodQuarter = searchParams.get('periodQuarter');
    const periodMonth = searchParams.get('periodMonth');
    const driverId = searchParams.get('driverId');

    if (!periodType || !periodYear) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'periodType and periodYear are required' },
        },
        { status: 400 }
      );
    }

    const year = parseInt(periodYear, 10);
    const quarter = periodQuarter ? parseInt(periodQuarter, 10) : undefined;
    const month = periodMonth ? parseInt(periodMonth, 10) : undefined;

    if (isNaN(year)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid periodYear' },
        },
        { status: 400 }
      );
    }

    if (periodType === 'QUARTER' && (!quarter || quarter < 1 || quarter > 4)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid periodQuarter (must be 1-4)' },
        },
        { status: 400 }
      );
    }

    if (periodType === 'MONTH' && (!month || month < 1 || month > 12)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid periodMonth (must be 1-12)' },
        },
        { status: 400 }
      );
    }

    const entries = await IFTAManager.getIFTAReport(
      session.user.companyId,
      periodType,
      year,
      quarter,
      month,
      driverId || undefined,
      true, // autoCalculate
      mcNumberId // MC filter
    );

    // Aggregate data by driver/truck
    const aggregated: Record<
      string,
      {
        driverId: string;
        driverName: string;
        truckId: string | null;
        truckNumber: string | null;
        stateMileages: Record<string, { miles: number; tax: number; deduction: number }>;
        totalMiles: number;
        totalTax: number;
        totalDeduction: number;
        loads: Array<{ loadId: string; loadNumber: string }>;
      }
    > = {};

    for (const entry of entries) {
      const key = entry.driverId;
      if (!aggregated[key]) {
        aggregated[key] = {
          driverId: entry.driverId,
          driverName: `${entry.driver.user.firstName} ${entry.driver.user.lastName}`,
          truckId: entry.truckId,
          truckNumber: entry.truck?.truckNumber || null,
          stateMileages: {},
          totalMiles: 0,
          totalTax: 0,
          totalDeduction: 0,
          loads: [],
        };
      }

      aggregated[key].totalMiles += entry.totalMiles;
      aggregated[key].totalTax += entry.totalTax;
      aggregated[key].totalDeduction += entry.totalDeduction;
      aggregated[key].loads.push({
        loadId: entry.loadId,
        loadNumber: entry.load.loadNumber,
      });

      // Aggregate state mileages
      for (const sm of entry.stateMileages) {
        if (!aggregated[key].stateMileages[sm.state]) {
          aggregated[key].stateMileages[sm.state] = {
            miles: 0,
            tax: 0,
            deduction: 0,
          };
        }
        aggregated[key].stateMileages[sm.state].miles += sm.miles;
        aggregated[key].stateMileages[sm.state].tax += sm.tax;
        aggregated[key].stateMileages[sm.state].deduction += sm.deduction;
      }
    }

    // Convert to array and format
    const reportData = Object.values(aggregated).map((item) => ({
      ...item,
      stateMileages: Object.entries(item.stateMileages).map(([state, data]) => ({
        state,
        ...data,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        entries: reportData,
        period: {
          type: periodType,
          year,
          quarter,
          month,
        },
      },
    });
  } catch (error) {
    console.error('IFTA report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate IFTA report',
        },
      },
      { status: 500 }
    );
  }
}







