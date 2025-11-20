import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Note: Seed data creation has been disabled.
  // Create your company and data through the application interface.
  
  console.log('ℹ️  No seed data will be created. Please create your company through the application.');
  
  console.log('✅ Seeding completed (no data created)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

