#!/usr/bin/env node

/**
 * Script to check NextAuth configuration
 * Run: node scripts/check-auth-config.js
 */

const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
];

const optionalEnvVars = [
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_BASE_PATH',
];

console.log('🔍 Checking NextAuth Configuration...\n');

let hasErrors = false;

// Check required environment variables
console.log('Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const masked = varName.includes('SECRET') || varName.includes('PASSWORD')
      ? '*'.repeat(Math.min(value.length, 20)) + '...'
      : value.length > 50
      ? value.substring(0, 50) + '...'
      : value;
    console.log(`  ✅ ${varName}: ${masked}`);
  }
});

console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ⚠️  ${varName}: Not set (may cause issues)`);
  } else {
    console.log(`  ✅ ${varName}: ${value}`);
  }
});

// Check NEXTAUTH_SECRET length
const secret = process.env.NEXTAUTH_SECRET;
if (secret) {
  if (secret.length < 32) {
    console.log(`\n⚠️  Warning: NEXTAUTH_SECRET should be at least 32 characters (current: ${secret.length})`);
  } else {
    console.log(`\n✅ NEXTAUTH_SECRET length: ${secret.length} characters (OK)`);
  }
}

if (hasErrors) {
  console.log('\n❌ Configuration errors found!');
  console.log('\nTo fix:');
  console.log('1. Create a .env file in the project root');
  console.log('2. Add the missing environment variables');
  console.log('3. Generate NEXTAUTH_SECRET:');
  console.log('   - Windows PowerShell:');
  console.log('     -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})');
  console.log('   - Linux/Mac:');
  console.log('     openssl rand -base64 32');
  console.log('   - Online: https://generate-secret.vercel.app/32');
  console.log('4. Restart your development server');
  process.exit(1);
} else {
  console.log('\n✅ All required configuration is present!');
  process.exit(0);
}

