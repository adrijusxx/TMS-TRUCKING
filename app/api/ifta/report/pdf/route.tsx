/**
 * IFTA Report PDF Generation API
 * 
 * Generates PDF for quarterly IFTA reports.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { iftaCalculatorService } from '@/lib/services/IFTACalculatorService';
import { PDFFactory } from '@/lib/pdf/PDFFactory';
import { IFTAReportPDF } from '@/lib/pdf/templates/IFTAReportPDF';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { z } from 'zod';
import React from 'react';

export const dynamic = 'force-dynamic';

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
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');

    // Default to current quarter
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

    // Generate report data
    const report = await iftaCalculatorService.generateQuarterlyReport(
      session.user.companyId,
      params.quarter,
      params.year,
      mcNumberId as string | string[] | undefined
    );

    // Fetch company
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        name: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        email: true,
      },
    });

    // Generate PDF
    const pdfBuffer = await PDFFactory.generate(
      React.createElement(IFTAReportPDF, { report, company: company ? { ...company, zip: company.zip } : null })
    );

    // Return PDF
    return PDFFactory.createResponse(
      pdfBuffer,
      `ifta-report-Q${params.quarter}-${params.year}.pdf`
    );
  } catch (error: unknown) {
    console.error('Error generating IFTA PDF:', error);

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



