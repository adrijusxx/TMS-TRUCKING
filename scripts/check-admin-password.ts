/**
 * Check what password the admin user actually has
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin1@demotruckingcompany.com';
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      email: true,
      password: true,
    },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Testing passwords for:', user.email);
  console.log('');

  const passwords = ['password123', 'admin123', 'admin@123', 'Admin123'];
  
  for (const pwd of passwords) {
    const isValid = await bcrypt.compare(pwd, user.password);
    console.log(`"${pwd}" (${pwd.length} chars): ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

