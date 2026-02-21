/**
 * Backfill estimated operating costs for existing loads.
 * Calculates fuel, maintenance, and fixed cost estimates based on miles
 * and SystemConfig/truck-specific MPG.
 *
 * Run with: npx ts-node scripts/backfill-estimated-op-costs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 100;
const INDUSTRY_DEFAULT_MPG = 6.5;
const MILES_PER_TRANSIT_DAY = 500;

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

async function main() {
  console.log('=== Backfill: Estimated Operating Costs ===\n');

  // Get all companies with SystemConfig
  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      systemConfig: {
        select: {
          averageFuelPrice: true,
          averageMpg: true,
          maintenanceCpm: true,
          fixedCostPerDay: true,
        },
      },
    },
  });

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const company of companies) {
    const config = company.systemConfig;
    const fuelPrice = config?.averageFuelPrice ?? 3.65;
    const fleetMpg = config?.averageMpg ?? INDUSTRY_DEFAULT_MPG;
    const maintenanceCpm = config?.maintenanceCpm ?? 0.18;
    const fixedCostPerDay = config?.fixedCostPerDay ?? 85;

    console.log(`\nCompany: ${company.name}`);
    console.log(`  Config: $${fuelPrice}/gal, ${fleetMpg} MPG, $${maintenanceCpm}/mi, $${fixedCostPerDay}/day`);

    // Count loads needing backfill
    const count = await prisma.load.count({
      where: {
        companyId: company.id,
        totalMiles: { gt: 0 },
        estimatedOpCost: null,
        deletedAt: null,
      },
    });

    if (count === 0) {
      console.log('  No loads to backfill.');
      continue;
    }

    console.log(`  Loads to backfill: ${count}`);

    // Process in batches
    let processed = 0;
    while (processed < count) {
      const loads = await prisma.load.findMany({
        where: {
          companyId: company.id,
          totalMiles: { gt: 0 },
          estimatedOpCost: null,
          deletedAt: null,
        },
        select: {
          id: true,
          totalMiles: true,
          truckId: true,
          truck: { select: { averageMpg: true } },
        },
        take: BATCH_SIZE,
      });

      if (loads.length === 0) break;

      for (const load of loads) {
        const miles = load.totalMiles ?? 0;
        if (miles <= 0) { totalSkipped++; continue; }

        // Resolve MPG: truck-specific → fleet → industry default
        const mpg = (load.truck?.averageMpg && load.truck.averageMpg > 0)
          ? load.truck.averageMpg
          : (fleetMpg > 0 ? fleetMpg : INDUSTRY_DEFAULT_MPG);

        const estimatedFuelCost = round2((miles / mpg) * fuelPrice);
        const estimatedMaintCost = round2(miles * maintenanceCpm);
        const transitDays = Math.ceil(miles / MILES_PER_TRANSIT_DAY);
        const estimatedFixedCost = round2(transitDays * fixedCostPerDay);
        const estimatedOpCost = round2(estimatedFuelCost + estimatedMaintCost + estimatedFixedCost);

        await prisma.load.update({
          where: { id: load.id },
          data: { estimatedFuelCost, estimatedMaintCost, estimatedFixedCost, estimatedOpCost },
        });

        totalUpdated++;
      }

      processed += loads.length;
      console.log(`  Progress: ${processed}/${count}`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Updated: ${totalUpdated} loads`);
  console.log(`Skipped: ${totalSkipped} loads (no miles)`);
}

main()
  .catch((e) => { console.error('Backfill failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
