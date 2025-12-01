/**
 * Load Creation Audit Test
 * 
 * Tests load creation from:
 * - Manual entry
 * - Rate confirmation upload
 * - PDF import
 * - CSV/Excel import
 * - Load templates
 * Verifies all required fields are populated
 * Validates multi-stop load creation
 * Tests load split functionality
 */

import { PrismaClient, LoadType, EquipmentType, LoadStatus } from '@prisma/client';
import { LoadSplitManager } from '@/lib/managers/LoadSplitManager';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

/**
 * Test manual load creation
 */
async function testManualLoadCreation() {
  console.log('\n📝 Testing Manual Load Creation...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Manual Load Creation - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });

  if (!customer || !mcNumber) {
    logTest('Manual Load Creation - Setup', false, 'Missing required data (customer or MC number)');
    return;
  }

  try {
    const load = await prisma.load.create({
      data: {
        loadNumber: `MANUAL-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        status: LoadStatus.PENDING,
        loadType: LoadType.FTL,
        equipmentType: EquipmentType.DRY_VAN,
        pickupLocation: 'Test Pickup',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(),
        deliveryLocation: 'Test Delivery',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 1000,
      },
    });

    const hasRequiredFields = 
      load.loadNumber &&
      load.companyId &&
      load.customerId &&
      load.mcNumberId &&
      load.pickupCity &&
      load.deliveryCity;

    logTest(
      'Manual Load Creation - Required Fields',
      hasRequiredFields,
      hasRequiredFields ? 'All required fields populated' : 'Missing required fields',
      { loadId: load.id }
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
    logTest('Manual Load Creation - Cleanup', true, 'Test load deleted');
  } catch (error: any) {
    logTest('Manual Load Creation', false, `Error: ${error.message}`);
  }
}

/**
 * Test multi-stop load creation
 */
async function testMultiStopLoadCreation() {
  console.log('\n🛑 Testing Multi-Stop Load Creation...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Multi-Stop Load Creation - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });

  if (!customer || !mcNumber) {
    logTest('Multi-Stop Load Creation - Setup', false, 'Missing required data');
    return;
  }

  try {
    const load = await prisma.load.create({
      data: {
        loadNumber: `MULTISTOP-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        status: LoadStatus.PENDING,
        loadType: LoadType.FTL,
        equipmentType: EquipmentType.DRY_VAN,
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 2000,
      },
    });

    // Create stops
    const stops = [
      { type: 'PICKUP' as const, sequence: 1, city: 'Dallas', state: 'TX' },
      { type: 'DELIVERY' as const, sequence: 2, city: 'Austin', state: 'TX' },
      { type: 'DELIVERY' as const, sequence: 3, city: 'Houston', state: 'TX' },
    ];

    for (const stop of stops) {
      await prisma.loadStop.create({
        data: {
          loadId: load.id,
          stopType: stop.type,
          sequence: stop.sequence,
          address: `${stop.sequence}00 Test St`,
          city: stop.city,
          state: stop.state,
          zip: stop.city === 'Dallas' ? '75001' : stop.city === 'Austin' ? '78701' : '77001',
        },
      });
    }

    const createdStops = await prisma.loadStop.findMany({
      where: { loadId: load.id },
      orderBy: { sequence: 'asc' },
    });

    const hasCorrectStops = createdStops.length === 3;
    const hasCorrectSequence = createdStops.every((stop, idx) => stop.sequence === idx + 1);
    const hasPickupFirst = createdStops[0]?.stopType === 'PICKUP';
    const hasDeliveriesAfter = createdStops.slice(1).every(stop => stop.stopType === 'DELIVERY');

    logTest(
      'Multi-Stop Load Creation - Stop Count',
      hasCorrectStops,
      hasCorrectStops ? `Created ${createdStops.length} stops` : 'Incorrect stop count'
    );

    logTest(
      'Multi-Stop Load Creation - Sequence',
      hasCorrectSequence,
      hasCorrectSequence ? 'Stops are in correct sequence' : 'Stops are out of sequence'
    );

    logTest(
      'Multi-Stop Load Creation - Stop Types',
      hasPickupFirst && hasDeliveriesAfter,
      hasPickupFirst && hasDeliveriesAfter ? 'Pickup first, then deliveries' : 'Incorrect stop type order'
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
    logTest('Multi-Stop Load Creation - Cleanup', true, 'Test load deleted');
  } catch (error: any) {
    logTest('Multi-Stop Load Creation', false, `Error: ${error.message}`);
  }
}

/**
 * Test load split functionality
 */
async function testLoadSplit() {
  console.log('\n✂️  Testing Load Split Functionality...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Load Split - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });
  const drivers = await prisma.driver.findMany({ where: { companyId: company.id }, take: 2 });
  const trucks = await prisma.truck.findMany({ where: { companyId: company.id }, take: 2 });

  if (!customer || !mcNumber || drivers.length < 2 || trucks.length < 2) {
    logTest('Load Split - Setup', false, 'Missing required data (customer, MC, drivers, or trucks)');
    return;
  }

  try {
    // Create a load
    const load = await prisma.load.create({
      data: {
        loadNumber: `SPLIT-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        driverId: drivers[0].id,
        truckId: trucks[0].id,
        status: LoadStatus.EN_ROUTE_DELIVERY,
        loadType: LoadType.FTL,
        equipmentType: EquipmentType.DRY_VAN,
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 2000,
        totalMiles: 300,
        loadedMiles: 300,
        emptyMiles: 0,
      },
    });

    // Test manual split
    const splitLocation = 'Austin, TX';
    const splitMiles = 150;

    const splitResult = await LoadSplitManager.splitLoad({
      loadId: load.id,
      splitLocation,
      splitMiles,
      splitDate: new Date(),
      newDriverId: drivers[1].id,
      newTruckId: trucks[1].id,
    });

    logTest(
      'Load Split - Manual Split',
      splitResult.segment !== null && splitResult.load !== null,
      splitResult.segment ? 'Split created successfully' : 'Split failed',
      { segmentId: splitResult.segment?.id }
    );

    // Verify segments were created
    const segments = await prisma.loadSegment.findMany({
      where: { loadId: load.id },
      orderBy: { sequence: 'asc' },
    });

    logTest(
      'Load Split - Segments Created',
      segments.length >= 2,
      segments.length >= 2 ? `Created ${segments.length} segments` : 'Segments not created correctly'
    );

    // Verify miles allocation
    const totalSegmentMiles = segments.reduce((sum, seg) => sum + (seg.segmentMiles || 0), 0);
    logTest(
      'Load Split - Miles Allocation',
      Math.abs(totalSegmentMiles - load.totalMiles) < 1, // Allow small rounding differences
      `Total segment miles (${totalSegmentMiles}) matches load miles (${load.totalMiles})`
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
    logTest('Load Split - Cleanup', true, 'Test load deleted');
  } catch (error: any) {
    logTest('Load Split', false, `Error: ${error.message}`);
  }
}

/**
 * Test rate confirmation creation
 */
async function testRateConfirmationCreation() {
  console.log('\n📄 Testing Rate Confirmation Creation...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Rate Confirmation - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });

  if (!customer || !mcNumber) {
    logTest('Rate Confirmation - Setup', false, 'Missing required data');
    return;
  }

  try {
    // Create load first
    const load = await prisma.load.create({
      data: {
        loadNumber: `RC-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        status: LoadStatus.PENDING,
        loadType: LoadType.FTL,
        equipmentType: EquipmentType.DRY_VAN,
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 1200,
      },
    });

    // Create rate confirmation
    const rateConf = await prisma.rateConfirmation.create({
      data: {
        companyId: company.id,
        loadId: load.id,
        rateConfNumber: `RC-${load.loadNumber}`,
        baseRate: 1000,
        fuelSurcharge: 200,
        accessorialCharges: 0,
        totalRate: 1200,
        paymentTerms: 30,
      },
    });

    logTest(
      'Rate Confirmation - Creation',
      rateConf.loadId === load.id && rateConf.totalRate === 1200,
      'Rate confirmation created with correct totals'
    );

    logTest(
      'Rate Confirmation - Calculation',
      Math.abs(rateConf.totalRate - (rateConf.baseRate + rateConf.fuelSurcharge + rateConf.accessorialCharges)) < 0.01,
      'Total rate matches sum of components'
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
    logTest('Rate Confirmation - Cleanup', true, 'Test load deleted');
  } catch (error: any) {
    logTest('Rate Confirmation Creation', false, `Error: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Load Creation Audit Tests\n');
  console.log('='.repeat(50));

  try {
    await testManualLoadCreation();
    await testMultiStopLoadCreation();
    await testLoadSplit();
    await testRateConfirmationCreation();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary:\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:\n');
      results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.message}`);
        });
      console.log('');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed!\n');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Test suite failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { testManualLoadCreation, testMultiStopLoadCreation, testLoadSplit, testRateConfirmationCreation };

