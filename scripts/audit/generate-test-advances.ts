/**
 * Test Driver Advance Generation Script
 * 
 * Generates driver advances:
 * - Fuel advances
 * - Cash advances
 * - Various approval statuses
 */

import { PrismaClient, ApprovalStatus, LoadStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TestAdvanceConfig {
  driverId: string;
  amount: number;
  approvalStatus: ApprovalStatus;
  loadId?: string; // If present, it's a fuel advance; if not, it's a cash advance
  requestDate?: Date;
  notes?: string;
}

/**
 * Generate a single test driver advance
 */
async function generateTestAdvance(config: TestAdvanceConfig): Promise<string> {
  const advance = await prisma.driverAdvance.create({
    data: {
      driverId: config.driverId,
      amount: config.amount,
      requestDate: config.requestDate || new Date(),
      approvalStatus: config.approvalStatus,
      loadId: config.loadId || undefined,
      notes: config.notes || (config.loadId ? 'Test fuel advance' : 'Test cash advance'),
      rejectionReason: config.approvalStatus === ApprovalStatus.REJECTED ? 'Test rejection reason' : undefined,
    },
  });

  return advance.id;
}

/**
 * Generate comprehensive set of test driver advances
 */
async function generateTestAdvances() {
  console.log('💵 Generating Test Driver Advances...\n');

  // Get drivers and company
  const drivers = await prisma.driver.findMany({
    where: { deletedAt: null },
    select: { id: true, companyId: true },
    take: 5,
  });

  if (drivers.length === 0) {
    console.log('⚠️  No drivers found. Skipping advance generation.');
    return [];
  }

  const generatedAdvanceIds: string[] = [];

  for (const driver of drivers) {
    console.log(`Adding advances for driver ${driver.id}...`);

    // Get loads for this driver
    const loads = await prisma.load.findMany({
      where: {
        driverId: driver.id,
        status: { in: [LoadStatus.ASSIGNED, LoadStatus.EN_ROUTE_PICKUP, LoadStatus.AT_PICKUP, LoadStatus.LOADED, LoadStatus.EN_ROUTE_DELIVERY, LoadStatus.AT_DELIVERY, LoadStatus.DELIVERED] },
        deletedAt: null,
      },
      select: { id: true },
      take: 3,
    });

    // Approved fuel advances (should be included in deductions)
    for (const load of loads) {
      generatedAdvanceIds.push(await generateTestAdvance({
        driverId: driver.id,
        amount: 300.00 + Math.random() * 200, // $300-500
        approvalStatus: ApprovalStatus.APPROVED,
        loadId: load.id, // Fuel advance (has loadId)
        requestDate: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)), // 7 days ago
      }));
    }

    // Approved cash advance (not tied to load)
    generatedAdvanceIds.push(await generateTestAdvance({
      driverId: driver.id,
      amount: 200.00,
      approvalStatus: ApprovalStatus.APPROVED,
      // No loadId = cash advance
      requestDate: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)), // 5 days ago
    }));

    // Pending advances (should NOT be included in deductions yet)
    generatedAdvanceIds.push(await generateTestAdvance({
      driverId: driver.id,
      amount: 150.00,
      approvalStatus: ApprovalStatus.PENDING,
      // No loadId = cash advance
      requestDate: new Date(),
    }));

    // Rejected advance (should NOT be included)
    generatedAdvanceIds.push(await generateTestAdvance({
      driverId: driver.id,
      amount: 250.00,
      approvalStatus: ApprovalStatus.REJECTED,
      loadId: loads[0]?.id, // Fuel advance (has loadId)
      requestDate: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)), // 3 days ago
    }));
  }

  console.log(`\n✅ Generated ${generatedAdvanceIds.length} test driver advances`);
  return generatedAdvanceIds;
}

async function main() {
  try {
    const advanceIds = await generateTestAdvances();
    console.log('✅ Test driver advance generation completed successfully');
    return advanceIds;
  } catch (error: any) {
    console.error('❌ Error generating test driver advances:', error);
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

export { generateTestAdvances, generateTestAdvance };

