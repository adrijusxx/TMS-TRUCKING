/**
 * Test Expense Generation Script
 * 
 * Generates test expenses for loads:
 * - Toll fees
 * - Scale tickets
 * - Lumper fees
 * - Permits
 * - Fuel expenses
 * - Other expenses
 * Tests both approved and pending expenses
 */

import { PrismaClient, LoadExpenseType, ApprovalStatus, LoadStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TestExpenseConfig {
  loadId: string;
  companyId: string;
  expenseType: LoadExpenseType;
  amount: number;
  approvalStatus: ApprovalStatus;
  reimbursable?: boolean;
  vendorId?: string;
}

/**
 * Generate a single test expense
 */
async function generateTestExpense(config: TestExpenseConfig): Promise<string> {
  const expense = await prisma.loadExpense.create({
    data: {
      loadId: config.loadId,
      expenseType: config.expenseType,
      amount: config.amount,
      category: config.expenseType,
      description: `Test ${config.expenseType} expense`,
      date: new Date(),
      approvalStatus: config.approvalStatus,
      reimbursable: config.reimbursable || false,
      vendorId: config.vendorId || undefined,
      receiptUrl: `https://example.com/receipt-${Date.now()}.pdf`,
    },
  });

  return expense.id;
}

/**
 * Generate comprehensive set of test expenses for loads
 */
async function generateTestExpenses(loadIds: string[]) {
  console.log('💰 Generating Test Expenses...\n');

  if (loadIds.length === 0) {
    console.log('⚠️  No load IDs provided. Skipping expense generation.');
    return [];
  }

  // Get company and vendor for expenses
  const firstLoad = await prisma.load.findUnique({
    where: { id: loadIds[0] },
    select: { companyId: true },
  });

  if (!firstLoad) {
    throw new Error('First load not found');
  }

  const vendor = await prisma.vendor.findFirst({
    where: { companyId: firstLoad.companyId },
  });

  const generatedExpenseIds: string[] = [];

  for (const loadId of loadIds) {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { companyId: true, status: true },
    });

    if (!load) continue;

    // Only add expenses to loads that are at least DISPATCHED
    if (load.status === 'PENDING') continue;

    console.log(`Adding expenses to load ${loadId}...`);

    // Approved expenses (should be included in calculations)
    const approvedExpenses = [
      { type: LoadExpenseType.TOLL, amount: 25.50, reimbursable: true },
      { type: LoadExpenseType.SCALE, amount: 50.00, reimbursable: true },
      { type: LoadExpenseType.LUMPER, amount: 150.00, reimbursable: false },
      { type: LoadExpenseType.PARKING, amount: 15.00, reimbursable: true },
    ];

    for (const expense of approvedExpenses) {
      generatedExpenseIds.push(await generateTestExpense({
        loadId,
        companyId: load.companyId,
        expenseType: expense.type,
        amount: expense.amount,
        approvalStatus: ApprovalStatus.APPROVED,
        reimbursable: expense.reimbursable,
        vendorId: vendor?.id,
      }));
    }

    // Pending expenses (should NOT be included in calculations yet)
    const pendingExpenses = [
      { type: LoadExpenseType.PERMIT, amount: 75.00 },
      { type: LoadExpenseType.OTHER, amount: 30.00 },
    ];

    for (const expense of pendingExpenses) {
      generatedExpenseIds.push(await generateTestExpense({
        loadId,
        companyId: load.companyId,
        expenseType: expense.type,
        amount: expense.amount,
        approvalStatus: ApprovalStatus.PENDING,
        reimbursable: false,
        vendorId: vendor?.id,
      }));
    }

    // Rejected expenses (should NOT be included)
    generatedExpenseIds.push(await generateTestExpense({
      loadId,
      companyId: load.companyId,
      expenseType: LoadExpenseType.OTHER,
      amount: 100.00,
      approvalStatus: ApprovalStatus.REJECTED,
      reimbursable: false,
    }));
  }

  console.log(`\n✅ Generated ${generatedExpenseIds.length} test expenses`);
  return generatedExpenseIds;
}

async function main() {
  try {
    // Get all DELIVERED loads for expense generation
    const loads = await prisma.load.findMany({
      where: {
        status: { in: [LoadStatus.ASSIGNED, LoadStatus.EN_ROUTE_PICKUP, LoadStatus.AT_PICKUP, LoadStatus.LOADED, LoadStatus.EN_ROUTE_DELIVERY, LoadStatus.AT_DELIVERY, LoadStatus.DELIVERED] },
        deletedAt: null,
      },
      select: { id: true },
      take: 10, // Limit to 10 loads for testing
    });

    const loadIds = loads.map(l => l.id);
    
    if (loadIds.length === 0) {
      console.log('⚠️  No eligible loads found for expense generation.');
      return [];
    }

    const expenseIds = await generateTestExpenses(loadIds);
    console.log('✅ Test expense generation completed successfully');
    return expenseIds;
  } catch (error: any) {
    console.error('❌ Error generating test expenses:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Script failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { generateTestExpenses, generateTestExpense };

