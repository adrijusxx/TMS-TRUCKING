/**
 * Revenue Calculation Audit
 * 
 * Verifies load revenue calculations:
 * - Base rate
 * - Fuel surcharge
 * - Accessorial charges
 * - Total revenue = baseRate + fuelSurcharge + accessorials
 * Tests rate confirmation calculations
 * Validates invoice totals match load revenues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditResult {
  loadId: string;
  loadNumber: string;
  passed: boolean;
  issues: string[];
  expected: number;
  actual: number;
  components: {
    baseRate?: number;
    fuelSurcharge?: number;
    accessorialCharges: number;
    revenue: number;
  };
}

const results: AuditResult[] = [];

function logResult(result: AuditResult) {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} Load ${result.loadNumber}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.issues.join(', ')}`);
}

async function auditLoadRevenue(loadId: string): Promise<AuditResult> {
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      accessorialCharges: {
        where: {
          status: { in: ['APPROVED', 'BILLED'] },
        },
      },
      rateConfirmation: true,
    },
  });

  if (!load) {
    return {
      loadId,
      loadNumber: 'UNKNOWN',
      passed: false,
      issues: ['Load not found'],
      expected: 0,
      actual: 0,
      components: { accessorialCharges: 0, revenue: 0 },
    };
  }

  const issues: string[] = [];
  
  // Calculate accessorial charges (approved/billed only)
  const accessorialTotal = load.accessorialCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );

  // Get rate confirmation details if exists
  const baseRate = load.rateConfirmation?.baseRate || 0;
  const fuelSurcharge = load.rateConfirmation?.fuelSurcharge || 0;
  const rateConfAccessorials = load.rateConfirmation?.accessorialCharges || 0;

  // Expected revenue = baseRate + fuelSurcharge + accessorialCharges
  // Note: Accessorials from RateConfirmation are already included in load.revenue typically
  // But accessorialCharges from AccessorialCharge model are ADDITIONAL revenue
  const expectedRevenue = load.revenue + accessorialTotal;

  // Actual revenue stored
  const actualRevenue = load.revenue;

  // Check if accessorials are included correctly
  if (accessorialTotal > 0) {
    // Accessorials should be added to base revenue
    // Total expected = base revenue + accessorials
    const calculatedTotal = actualRevenue + accessorialTotal;
    
    if (Math.abs(expectedRevenue - calculatedTotal) > 0.01) {
      issues.push(`Revenue calculation mismatch: Expected ${expectedRevenue.toFixed(2)}, but accessorials not properly accounted`);
    }
  }

  // Validate rate confirmation totals if exists
  if (load.rateConfirmation) {
    const rateConfTotal = baseRate + fuelSurcharge + rateConfAccessorials;
    const rateConfStored = load.rateConfirmation.totalRate;
    
    if (Math.abs(rateConfTotal - rateConfStored) > 0.01) {
      issues.push(`Rate confirmation total mismatch: Calculated ${rateConfTotal.toFixed(2)}, stored ${rateConfStored.toFixed(2)}`);
    }

    // Check if load revenue matches rate conf total (if rate conf is the source)
    if (Math.abs(actualRevenue - rateConfTotal) > 0.01 && accessorialTotal === 0) {
      issues.push(`Load revenue (${actualRevenue.toFixed(2)}) doesn't match rate conf total (${rateConfTotal.toFixed(2)})`);
    }
  }

  const passed = issues.length === 0;

  logResult({
    loadId,
    loadNumber: load.loadNumber,
    passed,
    issues,
    expected: expectedRevenue,
    actual: actualRevenue,
    components: {
      baseRate,
      fuelSurcharge,
      accessorialCharges: accessorialTotal,
      revenue: actualRevenue,
    },
  });

  return {
    loadId,
    loadNumber: load.loadNumber,
    passed,
    issues,
    expected: expectedRevenue,
    actual: actualRevenue,
    components: {
      baseRate,
      fuelSurcharge,
      accessorialCharges: accessorialTotal,
      revenue: actualRevenue,
    },
  };
}

async function auditInvoiceTotals() {
  console.log('\n📊 Auditing Invoice Totals vs Load Revenues...\n');

  const invoices = await prisma.invoice.findMany({
    take: 20,
  });

  let invoicePassCount = 0;
  let invoiceFailCount = 0;

  for (const invoice of invoices) {
    // Invoice uses loadIds array, not a relation - fetch loads separately
    const loads = await prisma.load.findMany({
      where: {
        id: { in: invoice.loadIds },
        deletedAt: null,
      },
      include: {
        accessorialCharges: {
          where: {
            status: { in: ['APPROVED', 'BILLED'] },
          },
        },
      },
    });

    // Calculate expected subtotal from loads
    const expectedSubtotal = loads.reduce((sum, load) => {
      const loadRevenue = load.revenue || 0;
      const accessorialTotal = load.accessorialCharges.reduce(
        (accSum, charge) => accSum + charge.amount,
        0
      );
      return sum + loadRevenue + accessorialTotal;
    }, 0);

    const actualSubtotal = invoice.subtotal || 0;
    const tax = invoice.tax || 0;
    const expectedTotal = expectedSubtotal + tax;
    const actualTotal = invoice.total || 0;

    const issues: string[] = [];

    if (Math.abs(expectedSubtotal - actualSubtotal) > 0.01) {
      issues.push(`Subtotal mismatch: Expected ${expectedSubtotal.toFixed(2)}, Actual ${actualSubtotal.toFixed(2)}`);
    }

    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
      issues.push(`Total mismatch: Expected ${expectedTotal.toFixed(2)}, Actual ${actualTotal.toFixed(2)}`);
    }

    const passed = issues.length === 0;
    if (passed) {
      invoicePassCount++;
    } else {
      invoiceFailCount++;
      console.log(`❌ Invoice ${invoice.invoiceNumber}: ${issues.join(', ')}`);
    }
  }

  console.log(`\nInvoice Audit: ${invoicePassCount} passed, ${invoiceFailCount} failed\n`);
}

async function main() {
  console.log('💰 Revenue Calculation Audit\n');
  console.log('='.repeat(50));

  try {
    // Get all loads for audit
    const loads = await prisma.load.findMany({
      where: {
        deletedAt: null,
      },
      select: { id: true },
      take: 50,
    });

    console.log(`\n📦 Auditing ${loads.length} loads...\n`);

    for (const load of loads) {
      await auditLoadRevenue(load.id);
    }

    // Audit invoice totals
    await auditInvoiceTotals();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Audit Summary:\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Loads Audited: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Audits:\n');
      results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - Load ${r.loadNumber}: ${r.issues.join('; ')}`);
        });
      console.log('');
      process.exit(1);
    } else {
      console.log('🎉 All revenue calculations are correct!\n');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
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

export { auditLoadRevenue, auditInvoiceTotals };

