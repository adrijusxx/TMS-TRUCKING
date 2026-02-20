/**
 * One-time backfill script: Geocode all LoadStop records that have no lat/lng.
 *
 * Usage: npx tsx scripts/backfill-stop-coordinates.ts
 *
 * Processes in batches of 10 with 200ms delay between batches
 * to avoid Google Maps API rate limiting.
 */

import { PrismaClient } from '@prisma/client';
import { geocodeAddress } from '../lib/maps/google-maps';

const prisma = new PrismaClient();
const BATCH_SIZE = 10;
const DELAY_MS = 200;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const total = await prisma.loadStop.count({ where: { lat: null } });
  console.log(`Found ${total} stops without coordinates`);

  let processed = 0;
  let geocoded = 0;
  let failed = 0;

  while (processed < total) {
    const stops = await prisma.loadStop.findMany({
      where: { lat: null },
      select: { id: true, address: true, city: true, state: true, zip: true },
      take: BATCH_SIZE,
    });

    if (stops.length === 0) break;

    for (const stop of stops) {
      const fullAddress = [stop.address, stop.city, stop.state, stop.zip]
        .filter(Boolean)
        .join(', ');

      try {
        const result = await geocodeAddress(fullAddress);
        if (result) {
          await prisma.loadStop.update({
            where: { id: stop.id },
            data: { lat: result.lat, lng: result.lng, geocodedAt: new Date() },
          });
          geocoded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    processed += stops.length;
    console.log(`Progress: ${processed}/${total} (geocoded: ${geocoded}, failed: ${failed})`);
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Geocoded: ${geocoded}, Failed: ${failed}, Total: ${total}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
