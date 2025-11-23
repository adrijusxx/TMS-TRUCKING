#!/usr/bin/env tsx
/**
 * Manual API Cache Cleanup Script
 * 
 * Usage:
 *   npx tsx scripts/cleanup-api-cache.ts
 * 
 * Or compile and run:
 *   npm run build
 *   node dist/scripts/cleanup-api-cache.js
 */

import { GeocodingCacheManager } from '../lib/managers/GeocodingCacheManager';

async function main() {
  console.log('Starting API cache cleanup...');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const deletedCount = await GeocodingCacheManager.cleanupExpired();
    
    console.log(`✅ Successfully cleaned up ${deletedCount} expired cache entries`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cache cleanup:', error);
    process.exit(1);
  }
}

main();

