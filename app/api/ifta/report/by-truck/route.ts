/**
 * IFTA Report By Truck API
 *
 * Generates quarterly IFTA reports grouped by truck with per-state breakdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { iftaCalculatorService } from '@/lib/services/IFTACalculatorService';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { z } from 'zod';

const reportSchema = z.object({
  quarter: z.coerce.number().min(1).max(4),
  year: z.coerce.number().min(2020).max(2100),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'ifta.view'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

    const params = reportSchema.parse({
      quarter: searchParams.get('quarter') || currentQuarter,
      year: searchParams.get('year') || now.getFullYear(),
    });

    const mcWhere = await buildMcNumberWhereClause(session, request);
    const mcNumberId = mcWhere?.mcNumberId;

    const report = await iftaCalculatorService.generateQuarterlyReportByTruck(
      session.user.companyId,
      params.quarter,
      params.year,
      mcNumberId as string | string[] | undefined
    );

    return NextResponse.json({ success: true, data: report });
  } catch (error: unknown) {
    console.error('Error generating IFTA by-truck report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.issues } },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
