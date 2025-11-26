#!/usr/bin/env node

/**
 * Generate a secure NEXTAUTH_SECRET
 * Run: node scripts/generate-auth-secret.js
 */

const crypto = require('crypto');

// Generate a random 32-byte secret and encode as base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n✅ Generated NEXTAUTH_SECRET:\n');
console.log(secret);
console.log('\n📝 Add this to your .env.local file:');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('\n⚠️  Keep this secret secure and never commit it to git!\n');

