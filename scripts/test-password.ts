/**
 * Script to test password verification
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Testing password verification...\n');

  const testEmail = 'admin1@demotruckingcompany.com';
  const testPassword = 'password123';

  const user = await prisma.user.findUnique({
    where: { email: testEmail.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      password: true,
      isActive: true,
    },
  });

  if (!user) {
    console.log(`❌ User not found: ${testEmail}`);
    return;
  }

  console.log(`✅ Found user: ${user.email}`);
  console.log(`   Active: ${user.isActive}`);
  console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log(`\n🔑 Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

  if (!isValid) {
    console.log('\n⚠️  Password mismatch detected!');
    console.log('   Regenerating password hash...');
    
    const newHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });
    
    console.log('✅ Password hash updated');
    
    // Verify again
    const userAfter = await prisma.user.findUnique({
      where: { email: testEmail.toLowerCase().trim() },
      select: { password: true },
    });
    
    const isValidAfter = await bcrypt.compare(testPassword, userAfter!.password);
    console.log(`\n🔑 Password verification after update: ${isValidAfter ? '✅ VALID' : '❌ INVALID'}`);
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

