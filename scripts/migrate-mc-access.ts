/**
 * Migration script to populate mcAccess for existing users
 * - Non-admins: mcAccess = [user.mcNumberId] (single MC access)
 * - Admins: mcAccess = [] (empty = access to all MCs)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting mcAccess migration...');

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      mcNumberId: true,
    },
  });

  console.log(`Found ${users.length} users to migrate`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      if (user.role === 'ADMIN') {
        // Admins get empty array (access to all MCs)
        await prisma.user.update({
          where: { id: user.id },
          data: { mcAccess: [] },
        });
        console.log(`Updated admin user ${user.id}: mcAccess = []`);
        updated++;
      } else {
        // Non-admins get their current mcNumberId in the array
        if (user.mcNumberId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { mcAccess: [user.mcNumberId] },
          });
          console.log(`Updated user ${user.id}: mcAccess = [${user.mcNumberId}]`);
          updated++;
        } else {
          console.log(`Skipped user ${user.id}: no mcNumberId assigned`);
          skipped++;
        }
      }
    } catch (error) {
      console.error(`Error updating user ${user.id}:`, error);
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


