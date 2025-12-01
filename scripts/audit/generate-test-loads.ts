/**
 * Test Load Generation Script
 * 
 * Generates test loads with various scenarios for comprehensive audit testing:
 * - Single-stop loads
 * - Multi-stop loads (2, 3, 4+ stops)
 * - Loads with rate confirmations
 * - Loads with split segments (driver/truck changes)
 * - Loads with different statuses
 * - Loads with and without POD documents
 * - Loads with different revenue/driver pay configurations
 */

import { PrismaClient, LoadStatus, LoadType, EquipmentType } from '@prisma/client';

const prisma = new PrismaClient();

interface TestLoadConfig {
  companyId: string;
  customerId: string;
  driverId?: string;
  truckId?: string;
  trailerId?: string;
  mcNumberId: string;
  status: LoadStatus;
  hasPOD: boolean;
  hasRateConf: boolean;
  hasMultiStop: boolean;
  stopCount?: number;
  revenue: number;
  driverPay?: number;
  fuelAdvance?: number;
  baseRate?: number;
  fuelSurcharge?: number;
}

/**
 * Generate a single test load
 */
async function generateTestLoad(config: TestLoadConfig): Promise<string> {
  const loadNumber = `TEST-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const pickupDate = new Date();
  const deliveryDate = new Date(pickupDate.getTime() + (24 * 60 * 60 * 1000)); // Next day

  // Create base load data
  const loadData: any = {
    loadNumber,
    companyId: config.companyId,
    customerId: config.customerId,
    mcNumberId: config.mcNumberId,
    status: config.status,
    loadType: LoadType.FTL,
    equipmentType: EquipmentType.DRY_VAN,
    pickupLocation: 'Dallas, TX',
    pickupAddress: '123 Test St',
    pickupCity: 'Dallas',
    pickupState: 'TX',
    pickupZip: '75001',
    pickupDate,
    deliveryLocation: 'Houston, TX',
    deliveryAddress: '456 Test Ave',
    deliveryCity: 'Houston',
    deliveryState: 'TX',
    deliveryZip: '77001',
    deliveryDate,
    weight: 10000,
    pieces: 10,
    commodity: 'Test Commodity',
    revenue: config.revenue,
    driverPay: config.driverPay || config.revenue * 0.70, // Default 70%
    fuelAdvance: config.fuelAdvance || 0,
    totalMiles: 250,
    loadedMiles: 250,
    emptyMiles: 0,
  };

  // Add status-specific dates
  if (config.status === LoadStatus.ASSIGNED || config.status === LoadStatus.EN_ROUTE_PICKUP || 
      config.status === LoadStatus.AT_PICKUP || config.status === LoadStatus.LOADED ||
      config.status === LoadStatus.EN_ROUTE_DELIVERY || config.status === LoadStatus.AT_DELIVERY ||
      config.status === LoadStatus.DELIVERED) {
    loadData.assignedAt = new Date(pickupDate.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before pickup
  }
  if (config.status === LoadStatus.AT_PICKUP || config.status === LoadStatus.LOADED ||
      config.status === LoadStatus.EN_ROUTE_DELIVERY || config.status === LoadStatus.AT_DELIVERY ||
      config.status === LoadStatus.DELIVERED) {
    loadData.pickedUpAt = pickupDate;
  }
  if (config.status === 'DELIVERED') {
    loadData.deliveredAt = deliveryDate;
    loadData.readyForSettlement = true;
  }

  if (config.driverId) {
    loadData.driverId = config.driverId;
  }
  if (config.truckId) {
    loadData.truckId = config.truckId;
  }
  if (config.trailerId) {
    loadData.trailerId = config.trailerId;
  }

  // Create load
  const load = await prisma.load.create({
    data: loadData,
  });

  // Create POD document if needed
  if (config.hasPOD && config.status === LoadStatus.DELIVERED) {
    const userId = (await prisma.user.findFirst({ where: { companyId: config.companyId }, select: { id: true } }))?.id || config.companyId;
    await prisma.document.create({
      data: {
        companyId: config.companyId,
        title: `POD - ${loadNumber}`,
        fileName: `POD-${loadNumber}.pdf`,
        fileUrl: `https://example.com/pod-${loadNumber}.pdf`,
        fileSize: 102400, // 100KB
        mimeType: 'application/pdf',
        type: 'POD',
        loadId: load.id,
        uploadedBy: userId,
      },
    });
    loadData.podUploadedAt = deliveryDate;
  }

  // Create rate confirmation if needed
  if (config.hasRateConf) {
    const baseRate = config.baseRate || config.revenue * 0.85;
    const fuelSurcharge = config.fuelSurcharge || config.revenue * 0.15;
    await prisma.rateConfirmation.create({
      data: {
        companyId: config.companyId,
        loadId: load.id,
        rateConfNumber: `RC-${loadNumber}`,
        baseRate,
        fuelSurcharge,
        accessorialCharges: 0,
        totalRate: baseRate + fuelSurcharge,
        paymentTerms: 30,
      },
    });
  }

  // Create multi-stop loads
  if (config.hasMultiStop && config.stopCount && config.stopCount > 1) {
    const stopCount = Math.min(config.stopCount, 6); // Max 6 stops for testing
    
    for (let i = 1; i <= stopCount; i++) {
      const isPickup = i === 1;
      const isLast = i === stopCount;
      
      await prisma.loadStop.create({
        data: {
          loadId: load.id,
          stopType: isPickup ? 'PICKUP' : 'DELIVERY',
          sequence: i,
          company: `Stop ${i} Company`,
          address: `${100 + i} Test St`,
          city: i % 2 === 0 ? 'Dallas' : 'Houston',
          state: 'TX',
          zip: i % 2 === 0 ? '75001' : '77001',
          phone: `555-000-${i.toString().padStart(4, '0')}`,
          earliestArrival: new Date(pickupDate.getTime() + (i * 2 * 60 * 60 * 1000)),
          latestArrival: new Date(pickupDate.getTime() + (i * 3 * 60 * 60 * 1000)),
          status: isLast && config.status === LoadStatus.DELIVERED ? 'COMPLETED' : 'PENDING',
          totalWeight: Math.floor(10000 / stopCount),
          totalPieces: Math.floor(10 / stopCount),
        },
      });
    }

    // Update load with multi-stop info
    await prisma.load.update({
      where: { id: load.id },
      data: {
        stopsCount: stopCount,
      },
    });
  }

  return load.id;
}

/**
 * Generate comprehensive set of test loads
 */
async function generateTestLoads() {
  console.log('📦 Generating Test Loads...\n');

  // Get first company and related data
  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error('No company found. Please seed the database first.');
  }

  const customer = await prisma.customer.findFirst({
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  if (!customer) {
    throw new Error('No customer found. Please seed the database first.');
  }

  const driver = await prisma.driver.findFirst({
    where: { companyId: company.id },
  });

  const truck = await prisma.truck.findFirst({
    where: { companyId: company.id },
  });

  const trailer = await prisma.trailer.findFirst({
    where: { companyId: company.id },
  });

  const mcNumber = await prisma.mcNumber.findFirst({
    where: { companyId: company.id },
  });
  if (!mcNumber) {
    throw new Error('No MC number found. Please seed the database first.');
  }

  const generatedLoads: string[] = [];

  // Scenario 1: Single-stop, PENDING, no POD, no rate conf
  console.log('Creating single-stop PENDING load...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: 'PENDING',
    hasPOD: false,
    hasRateConf: false,
    hasMultiStop: false,
    revenue: 1000,
  }));

  // Scenario 2: Single-stop, EN_ROUTE_PICKUP, no POD, with rate conf
  console.log('Creating single-stop EN_ROUTE_PICKUP load with rate conf...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: LoadStatus.EN_ROUTE_PICKUP,
    hasPOD: false,
    hasRateConf: true,
    hasMultiStop: false,
    revenue: 1200,
    baseRate: 1000,
    fuelSurcharge: 200,
  }));

  // Scenario 3: Single-stop, EN_ROUTE_DELIVERY, no POD
  console.log('Creating single-stop EN_ROUTE_DELIVERY load...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: LoadStatus.EN_ROUTE_DELIVERY,
    hasPOD: false,
    hasRateConf: true,
    hasMultiStop: false,
    revenue: 1500,
  }));

  // Scenario 4: Single-stop, DELIVERED, with POD, ready to bill
  console.log('Creating single-stop DELIVERED load with POD...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: 'DELIVERED',
    hasPOD: true,
    hasRateConf: true,
    hasMultiStop: false,
    revenue: 1800,
    driverPay: 1200,
    fuelAdvance: 300,
  }));

  // Scenario 5: Multi-stop (2 stops), DELIVERED
  console.log('Creating 2-stop DELIVERED load...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: 'DELIVERED',
    hasPOD: true,
    hasRateConf: true,
    hasMultiStop: true,
    stopCount: 2,
    revenue: 2500,
  }));

  // Scenario 6: Multi-stop (3 stops), DELIVERED
  console.log('Creating 3-stop DELIVERED load...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: 'DELIVERED',
    hasPOD: true,
    hasRateConf: true,
    hasMultiStop: true,
    stopCount: 3,
    revenue: 3200,
  }));

  // Scenario 7: Multi-stop (4 stops), EN_ROUTE_DELIVERY
  console.log('Creating 4-stop EN_ROUTE_DELIVERY load...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: LoadStatus.EN_ROUTE_DELIVERY,
    hasPOD: false,
    hasRateConf: true,
    hasMultiStop: true,
    stopCount: 4,
    revenue: 4000,
  }));

  // Scenario 8: Load with different revenue/driver pay ratio
  console.log('Creating load with custom driver pay ratio...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: 'DELIVERED',
    hasPOD: true,
    hasRateConf: true,
    hasMultiStop: false,
    revenue: 2000,
    driverPay: 1600, // 80% instead of default 70%
    fuelAdvance: 400,
  }));

  // Scenario 9: Load without driver/truck (unassigned)
  console.log('Creating unassigned load...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    mcNumberId: mcNumber.id,
    status: 'PENDING',
    hasPOD: false,
    hasRateConf: false,
    hasMultiStop: false,
    revenue: 800,
  }));

  // Scenario 10: Load with zero fuel advance
  console.log('Creating load with zero fuel advance...');
  generatedLoads.push(await generateTestLoad({
    companyId: company.id,
    customerId: customer.id,
    driverId: driver?.id,
    truckId: truck?.id,
    trailerId: trailer?.id,
    mcNumberId: mcNumber.id,
    status: 'DELIVERED',
    hasPOD: true,
    hasRateConf: true,
    hasMultiStop: false,
    revenue: 1500,
    driverPay: 1000,
    fuelAdvance: 0,
  }));

  console.log(`\n✅ Generated ${generatedLoads.length} test loads`);
  console.log(`Load IDs: ${generatedLoads.join(', ')}\n`);

  return generatedLoads;
}

async function main() {
  try {
    const loadIds = await generateTestLoads();
    console.log('✅ Test load generation completed successfully');
    return loadIds;
  } catch (error: any) {
    console.error('❌ Error generating test loads:', error);
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

export { generateTestLoads, generateTestLoad };

