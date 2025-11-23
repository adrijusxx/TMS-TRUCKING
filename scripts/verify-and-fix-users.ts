/**
 * Script to verify and fix user accounts for login
 * This script checks if the demo users exist and creates/updates them if needed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying demo user accounts...\n');

  const demoCompanyName = 'Demo Trucking Company';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Find or create the demo company
  let company = await prisma.company.findFirst({
    where: {
      name: {
        contains: demoCompanyName,
        mode: 'insensitive',
      },
    },
  });

  if (!company) {
    console.log('⚠️  Demo Trucking Company not found. Creating...');
    company = await prisma.company.create({
      data: {
        name: demoCompanyName,
        dotNumber: '1234567',
        mcNumber: 'MC-123456',
        address: '123 Main Street',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        phone: '555-0100',
        email: 'info@demotrucking.com',
        isActive: true,
      },
    });
    console.log('✅ Company created\n');
  } else {
    console.log(`✅ Found company: ${company.name}\n`);
  }

  // Find or create default MC Number
  let mcNumber = await prisma.mcNumber.findFirst({
    where: {
      companyId: company.id,
      isDefault: true,
    },
  });

  if (!mcNumber) {
    mcNumber = await prisma.mcNumber.create({
      data: {
        companyId: company.id,
        number: company.mcNumber || 'MC-123456',
        companyName: company.name,
        type: 'CARRIER',
        isDefault: true,
        usdot: company.dotNumber,
      },
    });
    console.log('✅ MC Number created\n');
  }

  // Users to verify/create
  const usersToCheck = [
    { email: 'admin1@demotruckingcompany.com', role: 'ADMIN', firstName: 'Admin', lastName: 'User 1' },
    { email: 'dispatcher1@demotruckingcompany.com', role: 'DISPATCHER', firstName: 'Dispatcher', lastName: 'User 1' },
    { email: 'driver1@demotruckingcompany.com', role: 'DRIVER', firstName: 'Driver', lastName: 'User 1' },
    { email: 'accountant1@demotruckingcompany.com', role: 'ACCOUNTANT', firstName: 'Accountant', lastName: 'User 1' },
  ];

  console.log('👥 Checking users...\n');

  for (const userData of usersToCheck) {
    const normalizedEmail = userData.email.toLowerCase().trim();
    
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log(`⚠️  User ${normalizedEmail} not found. Creating...`);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: '555-0101',
          role: userData.role as any,
          companyId: company.id,
          mcNumberId: mcNumber.id,
          isActive: true,
        },
      });
      console.log(`✅ Created user: ${normalizedEmail}`);
    } else {
      // Update password and ensure user is active
      const needsUpdate = 
        !user.isActive || 
        user.companyId !== company.id ||
        user.mcNumberId !== mcNumber.id;

      if (needsUpdate) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            isActive: true,
            companyId: company.id,
            mcNumberId: mcNumber.id,
          },
        });
        console.log(`✅ Updated user: ${normalizedEmail}`);
      } else {
        // Verify password works
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
          console.log(`✅ Reset password for: ${normalizedEmail}`);
        } else {
          console.log(`✅ User OK: ${normalizedEmail}`);
        }
      }
    }
  }

  console.log('\n🎉 Verification complete!\n');
  console.log('🔑 Login Credentials (all passwords: password123):');
  console.log('   Admin: admin1@demotruckingcompany.com');
  console.log('   Dispatcher: dispatcher1@demotruckingcompany.com');
  console.log('   Driver: driver1@demotruckingcompany.com');
  console.log('   Accountant: accountant1@demotruckingcompany.com');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

