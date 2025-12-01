/**
 * Test Accessorial Charge Generation Script
 * 
 * Generates accessorial charges:
 * - Detention charges (with hours/rates)
 * - Layover charges
 * - TONU charges
 * - Additional stops
 * - Fuel surcharges
 * - Other accessorials
 * Tests PENDING, APPROVED, BILLED statuses
 */

import { PrismaClient, AccessorialChargeType, AccessorialChargeStatus, LoadStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TestAccessorialConfig {
  loadId: string;
  companyId: string;
  chargeType: AccessorialChargeType;
  amount: number;
  status: AccessorialChargeStatus;
  detentionHours?: number;
  detentionRate?: number;
  layoverDays?: number;
  layoverRate?: number;
  tonuReason?: string;
}

/**
 * Generate a single test accessorial charge
 */
async function generateTestAccessorial(config: TestAccessorialConfig): Promise<string> {
  const charge = await prisma.accessorialCharge.create({
    data: {
      companyId: config.companyId,
      loadId: config.loadId,
      chargeType: config.chargeType,
      description: `Test ${config.chargeType} charge`,
      amount: config.amount,
      status: config.status,
      detentionHours: config.detentionHours,
      detentionRate: config.detentionRate,
      layoverDays: config.layoverDays,
      layoverRate: config.layoverRate,
      tonuReason: config.tonuReason,
    },
  });

  return charge.id;
}

/**
 * Generate comprehensive set of test accessorial charges for loads
 */
async function generateTestAccessorials(loadIds: string[]) {
  console.log('📋 Generating Test Accessorial Charges...\n');

  if (loadIds.length === 0) {
    console.log('⚠️  No load IDs provided. Skipping accessorial generation.');
    return [];
  }

  // Get company for charges
  const firstLoad = await prisma.load.findUnique({
    where: { id: loadIds[0] },
    select: { companyId: true },
  });

  if (!firstLoad) {
    throw new Error('First load not found');
  }

  const generatedChargeIds: string[] = [];

  for (const loadId of loadIds) {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { companyId: true, status: true },
    });

    if (!load) continue;

    console.log(`Adding accessorial charges to load ${loadId}...`);

    // Approved charges (should be included in revenue)
    const detentionHours = 3;
    const detentionRate = 50.00;
    const detentionAmount = detentionHours * detentionRate;

    generatedChargeIds.push(await generateTestAccessorial({
      loadId,
      companyId: load.companyId,
      chargeType: AccessorialChargeType.DETENTION,
      amount: detentionAmount,
      status: AccessorialChargeStatus.APPROVED,
      detentionHours,
      detentionRate,
    }));

    // Billed charges (already on invoice)
    generatedChargeIds.push(await generateTestAccessorial({
      loadId,
      companyId: load.companyId,
      chargeType: AccessorialChargeType.FUEL_SURCHARGE,
      amount: 150.00,
      status: AccessorialChargeStatus.BILLED,
    }));

    // Layover charge (if load is delayed)
    if (load.status === 'DELIVERED') {
      const layoverDays = 1;
      const layoverRate = 200.00;
      
      generatedChargeIds.push(await generateTestAccessorial({
        loadId,
        companyId: load.companyId,
        chargeType: AccessorialChargeType.LAYOVER,
        amount: layoverDays * layoverRate,
        status: AccessorialChargeStatus.APPROVED,
        layoverDays,
        layoverRate,
      }));
    }

    // Pending charges (should NOT be included in calculations yet)
    generatedChargeIds.push(await generateTestAccessorial({
      loadId,
      companyId: load.companyId,
      chargeType: AccessorialChargeType.ADDITIONAL_STOP,
      amount: 75.00,
      status: AccessorialChargeStatus.PENDING,
    }));

    // Other approved charges
    generatedChargeIds.push(await generateTestAccessorial({
      loadId,
      companyId: load.companyId,
      chargeType: AccessorialChargeType.DRIVER_ASSIST,
      amount: 100.00,
      status: AccessorialChargeStatus.APPROVED,
    }));

    // TONU charge (if applicable)
    if (load.status === LoadStatus.PENDING || load.status === LoadStatus.ASSIGNED || load.status === LoadStatus.EN_ROUTE_PICKUP) {
      generatedChargeIds.push(await generateTestAccessorial({
        loadId,
        companyId: load.companyId,
        chargeType: AccessorialChargeType.TONU,
        amount: 250.00,
        status: AccessorialChargeStatus.PENDING,
        tonuReason: 'Customer cancelled order',
      }));
    }
  }

  console.log(`\n✅ Generated ${generatedChargeIds.length} test accessorial charges`);
  return generatedChargeIds;
}

async function main() {
  try {
    // Get all loads for accessorial generation
    const loads = await prisma.load.findMany({
      where: {
        deletedAt: null,
      },
      select: { id: true },
      take: 10, // Limit to 10 loads for testing
    });

    const loadIds = loads.map(l => l.id);
    
    if (loadIds.length === 0) {
      console.log('⚠️  No loads found for accessorial generation.');
      return [];
    }

    const chargeIds = await generateTestAccessorials(loadIds);
    console.log('✅ Test accessorial charge generation completed successfully');
    return chargeIds;
  } catch (error: any) {
    console.error('❌ Error generating test accessorial charges:', error);
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

export { generateTestAccessorials, generateTestAccessorial };

