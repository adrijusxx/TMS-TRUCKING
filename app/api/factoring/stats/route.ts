import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { FactoringStatus } from '@prisma/client';
import { FactoringManager } from '@/lib/managers/FactoringManager';

import { buildMcNumberWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateRange: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    // Build MC Number filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // Convert to string filter for Invoice model compatibility
    const effectiveMcWhere = await convertMcNumberIdToMcNumberString(mcWhere);
    const mcFilter = effectiveMcWhere.mcNumber ? { mcNumber: effectiveMcWhere.mcNumber } : {};

    // Get factoring stats
    const stats = await FactoringManager.getFactoringStats(mcWhere, dateRange);

    // Get invoices due for reserve release
    const invoicesDueForRelease = await FactoringManager.getInvoicesDueForReserveRelease(
      mcWhere
    );

    // Get invoices by factoring status
    const [submittedInvoices, fundedInvoices, reserveReleaseInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          customer: {
            companyId: session.user.companyId,
          },
          ...mcFilter,
          factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR,
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          balance: true,
          submittedToFactorAt: true,
          customer: {
            select: {
              name: true,
            },
          },
          factoringCompany: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { submittedToFactorAt: 'desc' },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: {
          customer: {
            companyId: session.user.companyId,
          },
          ...mcFilter,
          factoringStatus: FactoringStatus.FUNDED,
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          advanceAmount: true,
          reserveAmount: true,
          fundedAt: true,
          reserveReleaseDate: true,
          customer: {
            select: {
              name: true,
            },
          },
          factoringCompany: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { fundedAt: 'desc' },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: {
          customer: {
            companyId: session.user.companyId,
          },
          ...mcFilter,
          factoringStatus: FactoringStatus.RESERVE_RELEASED,
        },
        select: {
          id: true,
          invoiceNumber: true,
          reserveAmount: true,
          reserveReleaseDate: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { reserveReleaseDate: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        invoicesDueForRelease: invoicesDueForRelease.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          total: inv.total,
          reserveAmount: inv.reserveAmount,
          fundedAt: inv.fundedAt,
          reserveReleaseDate: inv.reserveReleaseDate,
          customer: {
            name: inv.customer.name,
          },
          factoringCompany: {
            name: inv.factoringCompany?.name,
          },
        })),
        submittedInvoices,
        fundedInvoices,
        reserveReleaseInvoices,
      },
    });
  } catch (error) {
    console.error('Factoring stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
      },
      { status: 500 }
    );
  }
}

