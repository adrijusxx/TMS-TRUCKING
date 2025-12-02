import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { getInvoiceFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { calculateAgingDays } from '@/lib/utils/aging';

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

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    // Note: Invoices use mcNumberId relation, not mcNumber string
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
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
    
    const roleFilter = await getInvoiceFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        viewingAll ? 'ADMIN_ALL_COMPANIES' : session.user.companyId,
        mcWhere.mcNumberId
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
        include: {
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
    console.error('Invoice list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

