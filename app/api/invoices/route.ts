import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, convertMcNumberIdToMcNumberString, buildMultiMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { getInvoiceFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { calculateAgingDays } from '@/lib/utils/aging';
import { handleApiError } from '@/lib/api/route-helpers';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'invoices.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (CRITICAL: Invoice uses mcNumber string, not mcNumberId)
    const mcWhereWithId = await buildMcNumberWhereClause(session, request);
    const mcWhere = await convertMcNumberIdToMcNumberString(mcWhereWithId);

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const invoiceDate = searchParams.get('invoiceDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dueDate = searchParams.get('dueDate');
    const minTotal = searchParams.get('minTotal');
    const mcNumber = searchParams.get('mcNumber');
    const reconciliationStatus = searchParams.get('reconciliationStatus');
    const factoringStatus = searchParams.get('factoringStatus');
    const paymentMethod = searchParams.get('paymentMethod');

    // Apply role-based filtering with MC context
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const viewingAll = isAdmin;

    // Extract mcNumber value for role filter (may be string or {in: string[]})
    const mcNumberValue = mcWhere.mcNumber
      ? (typeof mcWhere.mcNumber === 'string'
        ? mcWhere.mcNumber
        : (mcWhere.mcNumber as any).in?.[0])
      : undefined;

    const roleFilter = await getInvoiceFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        viewingAll ? 'ADMIN_ALL_COMPANIES' : session.user.companyId,
        mcNumberValue
      )
    );

    // Build where clause
    const where: any = viewingAll ? {} : { ...roleFilter, ...mcWhere };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    // Support both single date and date range
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        const date = new Date(startDate);
        date.setHours(0, 0, 0, 0);
        where.invoiceDate.gte = date;
      }
      if (endDate) {
        const date = new Date(endDate);
        date.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = date;
      }
    } else if (invoiceDate) {
      const date = new Date(invoiceDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.invoiceDate = {
        gte: date,
        lt: nextDay,
      };
    }

    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.dueDate = {
        gte: date,
        lt: nextDay,
      };
    }

    if (minTotal) {
      where.total = { gte: parseFloat(minTotal) };
    }

    // Legacy support for mcNumber query param (Invoice model still uses mcNumber string)
    if (mcNumber) {
      where.mcNumber = { contains: mcNumber, mode: 'insensitive' };
    }

    if (reconciliationStatus) {
      where.reconciliationStatus = reconciliationStatus;
    }

    if (factoringStatus) {
      where.factoringStatus = factoringStatus;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { mcNumber: { contains: search, mode: 'insensitive' } },
        { loadId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total, allInvoicesForTotals] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          companyId: true,
          customerId: true,
          invoiceNumber: true,
          loadIds: true,
          subtotal: true,
          tax: true,
          total: true,
          amountPaid: true,
          balance: true,
          status: true,
          invoiceDate: true,
          dueDate: true,
          paidDate: true,
          qbSynced: true,
          qbInvoiceId: true,
          qbSyncedAt: true,
          qbSyncStatus: true,
          qbSyncError: true,
          qbCustomerId: true,
          mcNumber: true,
          subStatus: true,
          reconciliationStatus: true,
          invoiceNote: true,
          paymentNote: true,
          loadId: true,
          totalAmount: true,
          paymentMethod: true,
          expectedPaymentDate: true,
          factoringStatus: true,
          factoringCompanyId: true,
          submittedToFactorAt: true,
          factoringSubmittedAt: true,
          fundedAt: true,
          reserveReleaseDate: true,
          factoringReserveReleasedAt: true,
          factoringFee: true,
          reserveAmount: true,
          advanceAmount: true,
          shortPayAmount: true,
          shortPayReasonCode: true,
          shortPayReason: true,
          shortPayApproved: true,
          shortPayApprovedById: true,
          shortPayApprovedAt: true,
          disputedAt: true,
          disputedReason: true,
          writtenOffAt: true,
          writtenOffReason: true,
          writtenOffById: true,
          notes: true,
          factoringBatchId: true,
          invoiceBatchId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              customerNumber: true,
            },
          },
          factoringCompany: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
      // Get all invoices for grand totals (unfiltered, but still respecting role-based access)
      prisma.invoice.findMany({
        where: viewingAll ? {} : { ...roleFilter, ...mcWhere },
        select: {
          total: true,
          amountPaid: true,
          balance: true,
        },
      }),
    ]);

    // 5. Filter Sensitive Fields based on role and add aging calculations
    const filteredInvoices = invoices.map((invoice) => {
      const filtered = filterSensitiveFields(invoice, session.user.role as any);
      const agingDays = calculateAgingDays(invoice.dueDate);
      const agingStatus = agingDays <= 0 ? 'NOT_OVERDUE' : 'OVERDUE';

      return {
        ...filtered,
        agingDays,
        agingStatus,
        accrual: invoice.total,
        // Map amountPaid to paidAmount for frontend compatibility
        paidAmount: invoice.amountPaid,
      };
    });

    // Calculate summary totals for filtered results
    const filteredTotals = filteredInvoices.reduce(
      (acc, invoice) => {
        const total = invoice.total || 0;
        const amountPaid = invoice.amountPaid || 0;
        return {
          accrual: acc.accrual + (invoice.accrual || total),
          paid: acc.paid + amountPaid,
          balance: acc.balance + (invoice.balance ?? (total - amountPaid)),
        };
      },
      { accrual: 0, paid: 0, balance: 0 }
    );

    // Calculate grand totals (all invoices)
    const grandTotals = allInvoicesForTotals.reduce(
      (acc, invoice) => {
        const total = invoice.total || 0;
        const amountPaid = invoice.amountPaid || 0;
        return {
          accrual: acc.accrual + total,
          paid: acc.paid + amountPaid,
          balance: acc.balance + (invoice.balance ?? (total - amountPaid)),
        };
      },
      { accrual: 0, paid: 0, balance: 0 }
    );

    // 6. Return Success Response
    return NextResponse.json({
      success: true,
      data: filteredInvoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totals: {
          filtered: filteredTotals,
          grand: grandTotals,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

