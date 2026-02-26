import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export type FeedSource = 'COMPANY_EXPENSE' | 'BREAKDOWN_PAYMENT' | 'LOAD_EXPENSE';

export interface UnifiedExpenseEntry {
  id: string;
  source: FeedSource;
  sourceId: string;
  expenseNumber: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  categoryColor: string | null;
  department: string | null;
  paymentInstrument: { id: string; name: string; color: string | null; lastFour: string | null } | null;
  vendor: string | null;
  approvalStatus: string | null;
  hasReceipt: boolean;
  receiptUrl: string | null;
  linkedReference: string | null;
  mcNumber: { id: string; number: string } | null;
  createdBy: { firstName: string; lastName: string };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'company_expenses.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;

    const source = searchParams.get('source');
    const department = searchParams.get('department');
    const instrumentId = searchParams.get('instrumentId');
    const approvalStatus = searchParams.get('approvalStatus');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const hasReceiptRaw = searchParams.get('hasReceipt');
    const hasReceiptFilter = hasReceiptRaw === 'true' ? true : hasReceiptRaw === 'false' ? false : undefined;
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const mcWhere = await buildMcNumberWhereClause(session, request);
    const companyId = session.user.companyId;

    const dateFilter = (dateFrom || dateTo)
      ? {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      : undefined;

    const sources: FeedSource[] = source
      ? ([source] as FeedSource[])
      : ['COMPANY_EXPENSE', 'BREAKDOWN_PAYMENT', 'LOAD_EXPENSE'];

    const [companyExpenses, breakdownPayments, loadExpenses] = await Promise.all([
      sources.includes('COMPANY_EXPENSE')
        ? prisma.companyExpense.findMany({
            where: {
              deletedAt: null,
              ...mcWhere,
              ...(department && { department: department as any }),
              ...(instrumentId && { paymentInstrumentId: instrumentId }),
              ...(approvalStatus && { approvalStatus: approvalStatus as any }),
              ...(dateFilter && { date: dateFilter }),
              ...(hasReceiptFilter !== undefined && { hasReceipt: hasReceiptFilter }),
              ...(search && {
                OR: [
                  { description: { contains: search, mode: 'insensitive' } },
                  { expenseNumber: { contains: search, mode: 'insensitive' } },
                  { vendorName: { contains: search, mode: 'insensitive' } },
                ],
              }),
            },
            include: {
              expenseType: { select: { name: true, color: true } },
              paymentInstrument: { select: { id: true, name: true, color: true, lastFour: true } },
              vendor: { select: { name: true } },
              createdBy: { select: { firstName: true, lastName: true } },
              mcNumber: { select: { id: true, number: true } },
            },
            orderBy: { date: 'desc' },
          })
        : Promise.resolve([]),

      sources.includes('BREAKDOWN_PAYMENT')
        ? prisma.payment.findMany({
            where: {
              type: { in: ['BREAKDOWN', 'FUEL'] },
              breakdown: { companyId, deletedAt: null },
              ...(instrumentId && { paymentInstrumentId: instrumentId }),
              ...(dateFilter && { paymentDate: dateFilter }),
              ...(hasReceiptFilter !== undefined && { hasReceipt: hasReceiptFilter }),
              ...(search && {
                OR: [
                  { paymentNumber: { contains: search, mode: 'insensitive' } },
                  { notes: { contains: search, mode: 'insensitive' } },
                ],
              }),
            },
            include: {
              paymentInstrument: { select: { id: true, name: true, color: true, lastFour: true } },
              breakdown: { select: { breakdownNumber: true } },
              fuelEntry: { select: { truck: { select: { truckNumber: true } } } },
              createdBy: { select: { firstName: true, lastName: true } },
              mcNumber: { select: { id: true, number: true } },
            },
            orderBy: { paymentDate: 'desc' },
          })
        : Promise.resolve([]),

      sources.includes('LOAD_EXPENSE')
        ? prisma.loadExpense.findMany({
            where: {
              load: { companyId, deletedAt: null },
              ...(instrumentId && { paymentInstrumentId: instrumentId }),
              ...(approvalStatus && { approvalStatus: approvalStatus as any }),
              ...(dateFilter && { date: dateFilter }),
              ...(hasReceiptFilter !== undefined && {
                receiptUrl: hasReceiptFilter ? { not: null } : null,
              }),
              ...(search && {
                OR: [
                  { description: { contains: search, mode: 'insensitive' } },
                  { expenseNumber: { contains: search, mode: 'insensitive' } },
                ],
              }),
            },
            include: {
              paymentInstrument: { select: { id: true, name: true, color: true, lastFour: true } },
              load: { select: { loadNumber: true, mcNumberId: true } },
              vendor: { select: { name: true } },
              approvedBy: { select: { firstName: true, lastName: true } },
            },
            orderBy: { date: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Normalize all records into unified shape
    const normalized: UnifiedExpenseEntry[] = [
      ...companyExpenses.map((e) => ({
        id: e.id,
        source: 'COMPANY_EXPENSE' as FeedSource,
        sourceId: e.id,
        expenseNumber: e.expenseNumber,
        date: e.date,
        amount: e.amount,
        description: e.description,
        category: e.expenseType.name,
        categoryColor: e.expenseType.color,
        department: e.department,
        paymentInstrument: e.paymentInstrument,
        vendor: e.vendor?.name ?? e.vendorName ?? null,
        approvalStatus: e.approvalStatus,
        hasReceipt: e.hasReceipt,
        receiptUrl: e.receiptUrl ?? null,
        linkedReference: null,
        mcNumber: e.mcNumber,
        createdBy: e.createdBy,
      })),
      ...breakdownPayments.map((p) => ({
        id: p.id,
        source: 'BREAKDOWN_PAYMENT' as FeedSource,
        sourceId: p.id,
        expenseNumber: p.paymentNumber,
        date: p.paymentDate,
        amount: p.amount,
        description: p.notes ?? `${p.type} payment`,
        category: p.type === 'BREAKDOWN' ? 'Breakdown Repair' : 'Fuel',
        categoryColor: null,
        department: p.type === 'BREAKDOWN' ? 'FLEET' : 'OPERATIONS',
        paymentInstrument: p.paymentInstrument,
        vendor: null,
        approvalStatus: null,
        hasReceipt: p.hasReceipt,
        receiptUrl: null,
        linkedReference: p.breakdown?.breakdownNumber ?? p.fuelEntry?.truck?.truckNumber ?? null,
        mcNumber: p.mcNumber,
        createdBy: p.createdBy,
      })),
      ...loadExpenses.map((e) => ({
        id: e.id,
        source: 'LOAD_EXPENSE' as FeedSource,
        sourceId: e.id,
        expenseNumber: e.expenseNumber ?? e.id.slice(0, 8).toUpperCase(),
        date: e.date,
        amount: e.amount,
        description: e.description ?? e.expenseType,
        category: e.expenseType,
        categoryColor: null,
        department: e.expenseType === 'LUMPER' ? 'OPERATIONS' : null,
        paymentInstrument: e.paymentInstrument,
        vendor: e.vendor?.name ?? null,
        approvalStatus: e.approvalStatus,
        hasReceipt: !!e.receiptUrl,
        receiptUrl: e.receiptUrl ?? null,
        linkedReference: e.load.loadNumber,
        mcNumber: null,
        createdBy: e.approvedBy ?? { firstName: 'System', lastName: '' },
      })),
    ];

    // Sort by selected field
    normalized.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortBy) {
        case 'amount':
          aVal = a.amount; bVal = b.amount;
          break;
        case 'description':
          aVal = (a.description ?? '').toLowerCase();
          bVal = (b.description ?? '').toLowerCase();
          break;
        case 'category':
          aVal = (a.category ?? '').toLowerCase();
          bVal = (b.category ?? '').toLowerCase();
          break;
        case 'department':
          aVal = (a.department ?? '').toLowerCase();
          bVal = (b.department ?? '').toLowerCase();
          break;
        default:
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = normalized.length;
    const paginated = normalized.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/company-expenses/feed error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments feed' } },
      { status: 500 },
    );
  }
}
