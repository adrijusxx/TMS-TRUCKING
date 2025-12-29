/**
 * Script to fix admin user permissions
 * Run with: npx tsx scripts/fix-admin-user.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminUser(email: string) {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        mcNumber: true
      }
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`\n📋 Current user details:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Company: ${user.company.name}`);
    console.log(`   Active: ${user.isActive}`);

    if (user.role === 'ADMIN') {
      console.log(`\n✅ User is already an ADMIN. No changes needed.`);
      return;
    }

    // Update to ADMIN
    console.log(`\n🔧 Updating user role to ADMIN...`);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        isActive: true // Ensure account is active
      }
    });

    console.log(`\n✅ Successfully updated user to ADMIN!`);
    console.log(`   New Role: ${updatedUser.role}`);
    console.log(`   Active: ${updatedUser.isActive}`);
    console.log(`\n💡 Please log out and log back in for changes to take effect.`);

  } catch (error) {
    console.error(`\n❌ Error fixing admin user:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error(`\n❌ Please provide an email address!`);
  console.log(`\nUsage: npx tsx scripts/fix-admin-user.ts <email>`);
  console.log(`Example: npx tsx scripts/fix-admin-user.ts admin@example.com\n`);
  process.exit(1);
}

fixAdminUser(email);





