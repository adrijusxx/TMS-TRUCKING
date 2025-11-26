/**
 * MC System Verification Script
 * 
 * Tests:
 * 1. MC filtering with different user roles
 * 2. Record creation with mcNumberId assignment
 * 3. User MC access validation
 */

import { PrismaClient } from '@prisma/client';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';

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

async function testMcAccess() {
  console.log('\n📋 Testing User MC Access...\n');

  // Test 1: Admin users have empty mcAccess (all access)
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, mcAccess: true },
    take: 3,
  });

  for (const admin of admins) {
    const hasEmptyAccess = admin.mcAccess.length === 0;
    logTest(
      `Admin ${admin.email} mcAccess`,
      hasEmptyAccess,
      hasEmptyAccess ? 'Empty array (all access)' : `Has ${admin.mcAccess.length} MCs (should be empty)`
    );
  }

  // Test 2: Non-admin users have mcAccess array
  const nonAdmins = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: { id: true, email: true, role: true, mcAccess: true, mcNumberId: true },
    take: 5,
  });

  for (const user of nonAdmins) {
    const hasAccess = user.mcAccess.length > 0;
    const includesMcNumberId = user.mcNumberId ? user.mcAccess.includes(user.mcNumberId) : false;
    logTest(
      `${user.role} ${user.email} mcAccess`,
      hasAccess && includesMcNumberId,
      hasAccess
        ? `Has access to ${user.mcAccess.length} MC(s), includes assigned MC: ${includesMcNumberId}`
        : 'No MC access assigned'
    );
  }
}

async function testLoadMcNumberId() {
  console.log('\n📦 Testing Load mcNumberId Assignment...\n');

  // Test 1: All loads have mcNumberId
  const loads = await prisma.load.findMany({
    select: { id: true, loadNumber: true, mcNumberId: true, companyId: true },
    take: 10,
  });

  let loadsWithMcNumberId = 0;
  for (const load of loads) {
    if (load.mcNumberId) {
      loadsWithMcNumberId++;
    } else {
      logTest(
        `Load ${load.loadNumber} mcNumberId`,
        false,
        'Missing mcNumberId'
      );
    }
  }

  logTest(
    'Loads with mcNumberId',
    loadsWithMcNumberId === loads.length,
    `${loadsWithMcNumberId}/${loads.length} loads have mcNumberId`
  );

  // Test 2: Verify mcNumberId references valid McNumber
  for (const load of loads) {
    if (load.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findUnique({
        where: { id: load.mcNumberId },
        select: { id: true, number: true, companyId: true },
      });

      logTest(
        `Load ${load.loadNumber} mcNumberId reference`,
        mcNumber !== null && mcNumber.companyId === load.companyId,
        mcNumber
          ? `Valid reference to MC ${mcNumber.number}`
          : 'Invalid mcNumberId reference'
      );
    }
  }
}

async function testMcFiltering() {
  console.log('\n🔍 Testing MC Filtering Logic...\n');

  // Get test data
  const companies = await prisma.company.findMany({ take: 1 });
  if (companies.length === 0) {
    logTest('MC Filtering Test Setup', false, 'No companies found');
    return;
  }

  const company = companies[0];
  const mcNumbers = await prisma.mcNumber.findMany({
    where: { companyId: company.id },
    take: 2,
  });

  if (mcNumbers.length < 2) {
    logTest('MC Filtering Test Setup', false, 'Need at least 2 MC numbers for testing');
    return;
  }

  // Test 1: Admin with empty mcAccess (all access)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', companyId: company.id },
    select: { id: true, email: true, role: true, companyId: true, mcAccess: true },
  });

  if (admin) {
    const mockSession = {
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId,
        mcAccess: admin.mcAccess,
      },
    };

    const mcState = await McStateManager.getMcState(mockSession as any, null);
    const mcAccess = McStateManager.getMcAccess(mockSession as any);
    
    logTest(
      'Admin mcAccess (all access)',
      mcAccess.length === 0 || mcAccess.includes('ALL_ADMIN_ACCESS'),
      `Admin has ${mcAccess.length === 0 ? 'empty array (all access)' : 'special all-access indicator'}`
    );
  }

  // Test 2: Non-admin with limited mcAccess
  const nonAdmin = await prisma.user.findFirst({
    where: {
      role: { not: 'ADMIN' },
      companyId: company.id,
      mcAccess: { isEmpty: false },
    },
    select: { id: true, email: true, role: true, companyId: true, mcAccess: true },
  });

  if (nonAdmin) {
    const mockSession = {
      user: {
        id: nonAdmin.id,
        email: nonAdmin.email,
        role: nonAdmin.role,
        companyId: nonAdmin.companyId,
        mcAccess: nonAdmin.mcAccess,
      },
    };

    const mcAccess = McStateManager.getMcAccess(mockSession as any);
    const canAccessFirst = await McStateManager.canAccessMc(mockSession as any, nonAdmin.mcAccess[0]);
    const canAccessOther = mcNumbers.length > 1 
      ? await McStateManager.canAccessMc(mockSession as any, mcNumbers[1].id)
      : true;

    logTest(
      `Non-admin ${nonAdmin.role} mcAccess`,
      mcAccess.length > 0,
      `Has access to ${mcAccess.length} MC(s)`
    );

    logTest(
      `Non-admin can access assigned MC`,
      canAccessFirst,
      canAccessFirst ? 'Can access assigned MC' : 'Cannot access assigned MC'
    );

    if (mcNumbers.length > 1 && !nonAdmin.mcAccess.includes(mcNumbers[1].id)) {
      logTest(
        `Non-admin cannot access unassigned MC`,
        !canAccessOther,
        !canAccessOther ? 'Correctly blocked from unassigned MC' : 'Incorrectly allowed access'
      );
    }
  }
}

async function testRecordCreation() {
  console.log('\n✨ Testing Record Creation with mcNumberId...\n');

  // Get test data
  const company = await prisma.company.findFirst();
  if (!company) {
    logTest('Record Creation Test Setup', false, 'No company found');
    return;
  }

  const mcNumber = await prisma.mcNumber.findFirst({
    where: { companyId: company.id },
  });

  if (!mcNumber) {
    logTest('Record Creation Test Setup', false, 'No MC number found');
    return;
  }

  // Test: Create a test load with mcNumberId
  try {
    const testLoad = await prisma.load.create({
      data: {
        loadNumber: `TEST-LOAD-${Date.now()}`,
        companyId: company.id,
        customerId: (await prisma.customer.findFirst({ where: { companyId: company.id } }))?.id || company.id,
        mcNumberId: mcNumber.id,
        status: 'PENDING',
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
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

    logTest(
      'Create Load with mcNumberId',
      testLoad.mcNumberId === mcNumber.id,
      `Load created with mcNumberId: ${testLoad.mcNumberId}`
    );

    // Cleanup
    await prisma.load.delete({ where: { id: testLoad.id } });
    logTest('Test Load Cleanup', true, 'Test load deleted');
  } catch (error: any) {
    logTest('Create Load with mcNumberId', false, `Error: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 MC System Verification Tests\n');
  console.log('=' .repeat(50));

  try {
    await testMcAccess();
    await testLoadMcNumberId();
    await testMcFiltering();
    await testRecordCreation();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary:\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

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

main()
  .catch((e) => {
    console.error('❌ Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


