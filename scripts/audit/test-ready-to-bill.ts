/**
 * Ready-to-Bill Validation Test
 * 
 * Tests InvoiceManager.isReadyToBill() validation:
 * - Missing POD scenarios
 * - Rate mismatch scenarios (with/without brokerage split)
 * - Missing BOL weight scenarios
 * - Billing hold scenarios
 * Tests all validation gates
 */

import { PrismaClient, LoadStatus, CustomerType } from '@prisma/client';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function testMissingPODValidation() {
  console.log('\n📄 Testing Missing POD Validation...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Missing POD - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });
  const driver = await prisma.driver.findFirst({ where: { companyId: company.id } });

  if (!customer || !mcNumber) {
    logTest('Missing POD - Setup', false, 'Missing required data');
    return;
  }

  try {
    // Create load without POD
    const load = await prisma.load.create({
      data: {
        loadNumber: `NO-POD-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        driverId: driver?.id,
        status: LoadStatus.DELIVERED,
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 1500,
        driverPay: 1050,
      },
    });

    const invoiceManager = new InvoiceManager();
    const result = await invoiceManager.isReadyToBill(load.id);

    logTest(
      'Missing POD - Validation Failed',
      !result.ready && result.missingPOD === true,
      result.missingPOD ? 'Correctly identified missing POD' : 'Did not identify missing POD'
    );

    logTest(
      'Missing POD - Reason Provided',
      result.reasons && result.reasons.length > 0,
      result.reasons ? `Reason: ${result.reasons[0]}` : 'No reason provided'
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
  } catch (error: any) {
    logTest('Missing POD Validation', false, `Error: ${error.message}`);
  }
}

async function testRateMismatchValidation() {
  console.log('\n💰 Testing Rate Mismatch Validation...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Rate Mismatch - Setup', false, 'No company found');
    return;
  }

  // Create a non-BROKER customer
  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: 'Test Direct Customer',
      type: CustomerType.DIRECT,
      paymentTerms: 30,
    },
  });

  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });
  const driver = await prisma.driver.findFirst({ where: { companyId: company.id } });
  const user = await prisma.user.findFirst({ where: { companyId: company.id } });

  if (!mcNumber || !user) {
    logTest('Rate Mismatch - Setup', false, 'Missing required data');
    return;
  }

  try {
    // Create load with rate mismatch (revenue != driverPay)
    const load = await prisma.load.create({
      data: {
        loadNumber: `RATE-MISMATCH-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        driverId: driver?.id,
        status: LoadStatus.DELIVERED,
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 2000, // Customer pays $2000
        driverPay: 1200, // Driver gets $1200 (mismatch)
      },
    });

    // Add POD
    await prisma.document.create({
      data: {
        companyId: company.id,
        loadId: load.id,
        fileName: `POD-${load.loadNumber}.pdf`,
        fileUrl: `https://example.com/pod-${load.loadNumber}.pdf`,
        type: 'POD',
        uploadedBy: user.id,
      },
    });

    const invoiceManager = new InvoiceManager();
    const result = await invoiceManager.isReadyToBill(load.id, { allowBrokerageSplit: false });

    logTest(
      'Rate Mismatch - Validation Failed',
      !result.ready && result.rateMismatch === true,
      result.rateMismatch ? 'Correctly identified rate mismatch' : 'Did not identify rate mismatch'
    );

    // Test with brokerage split allowed (BROKER customer)
    const brokerCustomer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'Test Broker Customer',
        type: CustomerType.BROKER,
        paymentTerms: 30,
      },
    });

    const brokerLoad = await prisma.load.create({
      data: {
        loadNumber: `BROKER-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: brokerCustomer.id,
        mcNumberId: mcNumber.id,
        driverId: driver?.id,
        status: LoadStatus.DELIVERED,
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 2000,
        driverPay: 1200, // Mismatch allowed for brokers
      },
    });

    await prisma.document.create({
      data: {
        companyId: company.id,
        loadId: brokerLoad.id,
        fileName: `POD-${brokerLoad.loadNumber}.pdf`,
        fileUrl: `https://example.com/pod-${brokerLoad.loadNumber}.pdf`,
        type: 'POD',
        uploadedBy: user.id,
      },
    });

    const brokerResult = await invoiceManager.isReadyToBill(brokerLoad.id);

    logTest(
      'Rate Mismatch - Broker Allowed',
      brokerResult.ready === true || brokerResult.rateMismatch === false,
      brokerResult.ready ? 'Rate mismatch allowed for BROKER customer' : 'Rate mismatch still flagged for BROKER'
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
    await prisma.load.delete({ where: { id: brokerLoad.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.customer.delete({ where: { id: brokerCustomer.id } });
  } catch (error: any) {
    logTest('Rate Mismatch Validation', false, `Error: ${error.message}`);
  }
}

async function testMissingWeightValidation() {
  console.log('\n⚖️  Testing Missing Weight Validation...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Missing Weight - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });
  const driver = await prisma.driver.findFirst({ where: { companyId: company.id } });
  const user = await prisma.user.findFirst({ where: { companyId: company.id } });

  if (!customer || !mcNumber || !user) {
    logTest('Missing Weight - Setup', false, 'Missing required data');
    return;
  }

  try {
    // Create load with zero weight
    const load = await prisma.load.create({
      data: {
        loadNumber: `NO-WEIGHT-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        driverId: driver?.id,
        status: LoadStatus.DELIVERED,
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        weight: 0, // Zero weight
        revenue: 1500,
        driverPay: 1050,
      },
    });

    // Add POD
    await prisma.document.create({
      data: {
        companyId: company.id,
        loadId: load.id,
        fileName: `POD-${load.loadNumber}.pdf`,
        fileUrl: `https://example.com/pod-${load.loadNumber}.pdf`,
        type: 'POD',
        uploadedBy: user.id,
      },
    });

    const invoiceManager = new InvoiceManager();
    const result = await invoiceManager.isReadyToBill(load.id);

    logTest(
      'Missing Weight - Validation Failed',
      !result.ready && result.missingBOLWeight === true,
      result.missingBOLWeight ? 'Correctly identified missing/zero weight' : 'Did not identify missing weight'
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
  } catch (error: any) {
    logTest('Missing Weight Validation', false, `Error: ${error.message}`);
  }
}

async function testReadyToBillComplete() {
  console.log('\n✅ Testing Complete Ready-to-Bill Scenario...\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Complete Ready - Setup', false, 'No company found');
    return;
  }

  const customer = await prisma.customer.findFirst({ 
    where: { companyId: company.id },
    select: { id: true }, // Only select id to avoid schema mismatch issues
  });
  const mcNumber = await prisma.mcNumber.findFirst({ where: { companyId: company.id } });
  const driver = await prisma.driver.findFirst({ where: { companyId: company.id } });
  const user = await prisma.user.findFirst({ where: { companyId: company.id } });

  if (!customer || !mcNumber || !user) {
    logTest('Complete Ready - Setup', false, 'Missing required data');
    return;
  }

  try {
    // Create a complete load (POD, correct rates, weight)
    const load = await prisma.load.create({
      data: {
        loadNumber: `READY-TEST-${Date.now()}`,
        companyId: company.id,
        customerId: customer.id,
        mcNumberId: mcNumber.id,
        driverId: driver?.id,
        status: LoadStatus.DELIVERED,
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        pickupLocation: 'Dallas, TX',
        pickupAddress: '123 Test St',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        pickupZip: '75001',
        pickupDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveryLocation: 'Houston, TX',
        deliveryAddress: '456 Test Ave',
        deliveryCity: 'Houston',
        deliveryState: 'TX',
        deliveryZip: '77001',
        deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        weight: 10000,
        revenue: 1500,
        driverPay: 1050, // Matches for non-broker (or different but allowed)
      },
    });

    // Add POD
    await prisma.document.create({
      data: {
        companyId: company.id,
        loadId: load.id,
        fileName: `POD-${load.loadNumber}.pdf`,
        fileUrl: `https://example.com/pod-${load.loadNumber}.pdf`,
        type: 'POD',
        uploadedBy: user.id,
      },
    });

    const invoiceManager = new InvoiceManager();
    
    // If customer is BROKER, allow split; otherwise rates should match
    const customerType = customer.type;
    const allowSplit = customerType === 'BROKER';
    
    // If not broker and rates don't match, set driverPay to match revenue
    if (!allowSplit && load.revenue !== load.driverPay) {
      await prisma.load.update({
        where: { id: load.id },
        data: { driverPay: load.revenue },
      });
    }

    const result = await invoiceManager.isReadyToBill(load.id, { allowBrokerageSplit: allowSplit });

    logTest(
      'Complete Ready - All Validations Pass',
      result.ready === true,
      result.ready ? 'Load is ready to bill' : `Load not ready: ${result.reasons?.join(', ')}`
    );

    logTest(
      'Complete Ready - No Issues',
      !result.missingPOD && !result.missingBOLWeight && (!result.rateMismatch || allowSplit),
      'No validation issues found'
    );

    // Cleanup
    await prisma.load.delete({ where: { id: load.id } });
  } catch (error: any) {
    logTest('Complete Ready-to-Bill', false, `Error: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Ready-to-Bill Validation Tests\n');
  console.log('='.repeat(50));

  try {
    await testMissingPODValidation();
    await testRateMismatchValidation();
    await testMissingWeightValidation();
    await testReadyToBillComplete();

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

export { testMissingPODValidation, testRateMismatchValidation, testMissingWeightValidation, testReadyToBillComplete };

