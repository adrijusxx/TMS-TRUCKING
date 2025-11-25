/**
 * Script to check exact email formats in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking user emails in database...\n');

  const emailsToCheck = [
    'admin1@demotruckingcompany.com',
    'dispatcher1@demotruckingcompany.com',
    'driver1@demotruckingcompany.com',
    'accountant1@demotruckingcompany.com',
  ];

  for (const email of emailsToCheck) {
    const normalized = email.toLowerCase().trim();
    
    // Try exact match
    const exact = await prisma.user.findUnique({
      where: { email: normalized },
      select: {
        email: true,
        isActive: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (exact) {
      console.log(`✅ Found: "${exact.email}" (Active: ${exact.isActive}, Role: ${exact.role})`);
    } else {
      console.log(`❌ Not found: ${normalized}`);
      
      // Try case-insensitive search
      const allUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: normalized.split('@')[0],
            mode: 'insensitive',
          },
        },
        select: {
          email: true,
          isActive: true,
          role: true,
        },
      });
      
      if (allUsers.length > 0) {
        console.log(`   Similar emails found:`);
        allUsers.forEach(u => {
          console.log(`   - "${u.email}" (Active: ${u.isActive}, Role: ${u.role})`);
        });
      }
    }
  }

  console.log('\n📋 All users in Demo Trucking Company:');
  const company = await prisma.company.findFirst({
    where: {
      name: {
        contains: 'Demo Trucking Company',
        mode: 'insensitive',
      },
    },
  });

  if (company) {
    const users = await prisma.user.findMany({
      where: { companyId: company.id },
      select: {
        email: true,
        isActive: true,
        role: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { email: 'asc' },
    });

    users.forEach(u => {
      console.log(`   ${u.email} - ${u.role} (Active: ${u.isActive})`);
    });
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



