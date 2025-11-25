/**
 * Script to test login logic directly (simulating NextAuth authorize function)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Testing login logic directly...\n');

  const testCredentials = [
    { email: 'admin1@demotruckingcompany.com', password: 'password123' },
    { email: 'dispatcher1@demotruckingcompany.com', password: 'password123' },
    { email: 'driver1@demotruckingcompany.com', password: 'password123' },
    { email: 'accountant1@demotruckingcompany.com', password: 'password123' },
  ];

  for (const cred of testCredentials) {
    console.log(`\n📧 Testing: ${cred.email}`);
    
    // Simulate the authorize function logic
    const email = cred.email.toLowerCase().trim();
    const password = cred.password;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
      });

      if (!user) {
        console.log(`   ❌ User not found`);
        continue;
      }

      console.log(`   ✅ User found: ${user.firstName} ${user.lastName}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Active: ${user.isActive}`);
      console.log(`      Company: ${user.company.name}`);

      if (!user.isActive) {
        console.log(`   ❌ User is inactive`);
        continue;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log(`   ❌ Invalid password`);
        continue;
      }

      console.log(`   ✅ Password valid`);
      console.log(`   ✅ Login would succeed!`);
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
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



