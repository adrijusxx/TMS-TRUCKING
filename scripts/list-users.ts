/**
 * Script to list all users in the database
 * Run with: npx tsx scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log(`\n📋 Fetching all users...\n`);
    
    const users = await prisma.user.findMany({
      include: {
        company: true,
        mcNumber: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log(`❌ No users found in the database.`);
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);
    console.log(`${'#'.padEnd(3)} ${'Email'.padEnd(30)} ${'Name'.padEnd(25)} ${'Role'.padEnd(12)} ${'Active'.padEnd(8)} ${'Company'.padEnd(20)}`);
    console.log(`${'='.repeat(120)}`);

    users.forEach((user, index) => {
      const name = `${user.firstName} ${user.lastName}`.trim();
      const active = user.isActive ? '✓' : '✗';
      const company = user.company?.name || 'N/A';
      
      console.log(
        `${String(index + 1).padEnd(3)} ${user.email.padEnd(30)} ${name.padEnd(25)} ${user.role.padEnd(12)} ${active.padEnd(8)} ${company.padEnd(20)}`
      );
    });

    console.log(`\n💡 To fix a user's admin role, run:`);
    console.log(`   npx tsx scripts/fix-admin-user.ts <email>\n`);

  } catch (error) {
    console.error(`\n❌ Error listing users:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();





