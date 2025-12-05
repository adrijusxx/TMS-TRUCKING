/**
 * IFTA Report API
 * 
 * Generates quarterly IFTA reports with state-by-state breakdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { iftaCalculatorService } from '@/lib/services/IFTACalculatorService';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
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

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');

    // Default to current quarter if not provided
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();

    const params = reportSchema.parse({
      quarter: quarter || currentQuarter,
      year: year || currentYear,
    });

    // Get MC filter
    const mcWhere = await buildMcNumberWhereClause(session, request);
    const mcNumberId = mcWhere?.mcNumberId;

    // Generate report
    const report = await iftaCalculatorService.generateQuarterlyReport(
      session.user.companyId,
      params.quarter,
      params.year,
      mcNumberId as string | string[] | undefined
    );

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: unknown) {
    console.error('Error generating IFTA report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', details: error.issues },
        },
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
