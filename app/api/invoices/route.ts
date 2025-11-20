import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const invoiceDate = searchParams.get('invoiceDate');
    const dueDate = searchParams.get('dueDate');
    const minTotal = searchParams.get('minTotal');
    const mcNumber = searchParams.get('mcNumber');
    const mcViewMode = searchParams.get('mc'); // 'all', 'current', or specific MC ID (from CompanySwitcher)
    const reconciliationStatus = searchParams.get('reconciliationStatus');
    const isAdmin = session.user?.role === 'ADMIN';

    // Build base filter with MC number if applicable
    let baseFilter = await buildMcNumberWhereClause(session, request);
    
    // Admin-only: Override MC filter based on view mode
    let customerFilter: any = { ...baseFilter };
    
    if (isAdmin && mcViewMode) {
      if (mcViewMode === 'all') {
        // Show all MCs - only filter by company, not by MC number
        customerFilter = {
          companyId: session.user.companyId,
        };
        // Explicitly remove mcNumber if it exists
        delete customerFilter.mcNumber;
      } else if (mcViewMode !== 'current' && mcViewMode !== null) {
        // Filter by specific MC number ID (admin selecting specific MC)
        const mcNumberRecord = await prisma.mcNumber.findUnique({
          where: { id: mcViewMode },
          select: { number: true, companyId: true },
        });
        if (mcNumberRecord) {
          // Verify MC number belongs to user's accessible company
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, userCompanies: { select: { companyId: true } } },
          });
          const accessibleCompanyIds = [
            user?.companyId,
            ...(user?.userCompanies?.map((uc) => uc.companyId) || []),
          ].filter(Boolean) as string[];
          
          if (accessibleCompanyIds.includes(mcNumberRecord.companyId)) {
            customerFilter = {
              ...baseFilter,
              mcNumber: mcNumberRecord.number,
            };
          }
        }
      }
      // If mcViewMode is 'current' or null, use baseFilter as-is (current MC from session)
    }
    // Non-admin users: always use baseFilter (their assigned MC)

    // Get customer IDs for this company (filtered by MC number if applicable)
    const companyCustomers = await prisma.customer.findMany({
      where: { ...customerFilter, isActive: true },
      select: { id: true },
    });
    const customerIds = companyCustomers.map((c) => c.id);

    const where: any = {
      customerId: { in: customerIds },
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (invoiceDate) {
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

    // MC number filtering is already handled above via mcViewMode and baseFilter
    // The baseFilter is applied to the customer query, which filters invoices
    // Legacy support for mcNumber query param (if not already filtered by baseFilter)
    if (mcNumber && !baseFilter.mcNumber) {
      where.mcNumber = { contains: mcNumber, mode: 'insensitive' };
    }

    if (reconciliationStatus) {
      where.reconciliationStatus = reconciliationStatus;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { mcNumber: { contains: search, mode: 'insensitive' } },
        { loadId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
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
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

