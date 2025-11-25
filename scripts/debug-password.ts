/**
 * Script to debug password issues - check actual hash in database
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging password issue...\n');

  const email = 'admin1@demotruckingcompany.com';
  const password = 'password123';

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   Active: ${user.isActive}`);
  console.log(`   Password hash: ${user.password}`);
  console.log(`   Hash length: ${user.password.length}`);
  console.log(`   Hash prefix: ${user.password.substring(0, 30)}`);

  console.log('\n🔐 Testing password comparison:');
  console.log(`   Input password: "${password}"`);
  console.log(`   Input length: ${password.length}`);
  console.log(`   Input bytes:`, Buffer.from(password).toString('hex'));

  // Test 1: Direct comparison
  const result1 = await bcrypt.compare(password, user.password);
  console.log(`\n   Test 1 - Direct compare: ${result1 ? '✅ VALID' : '❌ INVALID'}`);

  // Test 2: With trim
  const result2 = await bcrypt.compare(password.trim(), user.password);
  console.log(`   Test 2 - With trim: ${result2 ? '✅ VALID' : '❌ INVALID'}`);

  // Test 3: Create new hash and compare
  console.log('\n🔧 Creating new hash for comparison:');
  const newHash = await bcrypt.hash(password, 10);
  console.log(`   New hash: ${newHash.substring(0, 30)}...`);
  const result3 = await bcrypt.compare(password, newHash);
  console.log(`   Test 3 - New hash compare: ${result3 ? '✅ VALID' : '❌ INVALID'}`);

  // Test 4: Check if hash is valid bcrypt format
  console.log('\n🔍 Checking hash format:');
  const hashParts = user.password.split('$');
  console.log(`   Hash parts: ${hashParts.length}`);
  if (hashParts.length >= 3) {
    console.log(`   Algorithm: $${hashParts[1]}`);
    console.log(`   Cost: ${hashParts[2]?.substring(0, 2)}`);
  }

  // Test 5: Update password if needed
  if (!result1) {
    console.log('\n⚠️  Password mismatch detected!');
    console.log('   Updating password hash...');
    
    const updatedHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: updatedHash },
    });
    
    console.log('   ✅ Password hash updated');
    
    // Verify update
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    
    const verifyResult = await bcrypt.compare(password, updatedUser!.password);
    console.log(`   ✅ Verification after update: ${verifyResult ? 'VALID' : 'INVALID'}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



