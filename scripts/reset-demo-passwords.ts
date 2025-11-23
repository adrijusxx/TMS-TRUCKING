/**
 * Script to reset all demo user passwords to ensure they're correct
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Resetting demo user passwords...\n');

  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const emails = [
    'admin1@demotruckingcompany.com',
    'dispatcher1@demotruckingcompany.com',
    'driver1@demotruckingcompany.com',
    'accountant1@demotruckingcompany.com',
  ];

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log(`⚠️  User not found: ${normalizedEmail}`);
      continue;
    }

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Verify the update
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    const isValid = await bcrypt.compare(password, updatedUser!.password);
    
    console.log(`${isValid ? '✅' : '❌'} ${normalizedEmail} - Password ${isValid ? 'reset and verified' : 'reset but verification failed'}`);
  }

  console.log('\n🎉 Password reset complete!');
  console.log('   All passwords are now: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

