import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * This script creates Four Ways Logistics company if it doesn't exist
 */
async function createFourWaysCompany() {
  console.log('🏢 Checking for Four Ways Logistics company...');
  
  try {
    // Check if company already exists (with various name variations)
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { contains: 'Four Ways', mode: 'insensitive' } },
          { name: { contains: 'FourWays', mode: 'insensitive' } },
          { name: { contains: 'fourways', mode: 'insensitive' } },
        ],
      },
    });

    if (existingCompany) {
      console.log(`✓ Four Ways Logistics already exists: ${existingCompany.name} (ID: ${existingCompany.id})`);
      console.log(`  DOT Number: ${existingCompany.dotNumber}`);
      console.log(`  MC Number: ${existingCompany.mcNumber || 'Not set'}`);
      return existingCompany;
    }

    // Find Demo Trucking LLC to get reference data
    const demoCompany = await prisma.company.findFirst({
      where: {
        name: {
          contains: 'Demo Trucking',
          mode: 'insensitive',
        },
      },
    });

    console.log('Creating Four Ways Logistics company...');

    // Generate a unique DOT number if Demo's DOT is already taken
    let dotNumber = demoCompany?.dotNumber || `DOT-${Date.now()}`;
    
    // Check if DOT number is available, if not generate a new one
    const existingDot = await prisma.company.findUnique({
      where: { dotNumber },
    });
    
    if (existingDot && existingDot.id !== demoCompany?.id) {
      // DOT number is taken, generate a unique one
      dotNumber = `DOT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      console.log(`  ⚠️  DOT number from Demo was already taken, using: ${dotNumber}`);
    }

    // Create Four Ways Logistics company using upsert to handle case where it might exist
    const fourWaysCompany = await prisma.company.upsert({
      where: { dotNumber },
      update: {
        name: 'Four Ways Logistics',
        // Don't update other fields if company already exists
      },
      create: {
        name: 'Four Ways Logistics',
        dotNumber: dotNumber,
        mcNumber: demoCompany?.mcNumber || undefined,
        address: demoCompany?.address || '123 Main St',
        city: demoCompany?.city || 'City',
        state: demoCompany?.state || 'ST',
        zip: demoCompany?.zip || '12345',
        phone: demoCompany?.phone || '555-1234',
        email: demoCompany?.email || 'info@fourwayslogistics.com',
        isActive: true,
      },
    });

    console.log(`✅ Created Four Ways Logistics company (ID: ${fourWaysCompany.id})`);
    console.log(`   DOT Number: ${fourWaysCompany.dotNumber}`);
    console.log(`   Email: ${fourWaysCompany.email}`);
    console.log('');

    // If Demo Trucking LLC exists, copy its MC numbers
    if (demoCompany) {
      const demoMcNumbers = await prisma.mcNumber.findMany({
        where: { companyId: demoCompany.id },
      });

      if (demoMcNumbers.length > 0) {
        console.log(`Creating ${demoMcNumbers.length} MC number(s) for Four Ways Logistics...`);
        for (const demoMc of demoMcNumbers) {
          const newMc = await prisma.mcNumber.create({
            data: {
              companyId: fourWaysCompany.id,
              number: demoMc.number,
              companyName: demoMc.companyName || fourWaysCompany.name,
              type: demoMc.type,
              usdot: demoMc.usdot || fourWaysCompany.dotNumber,
            },
          });
          console.log(`  ✓ Created MC number ${newMc.number} (ID: ${newMc.id})`);
        }
      }

      // Create an admin user for Four Ways Logistics
      const adminUser = await prisma.user.findFirst({
        where: {
          email: { contains: 'admin', mode: 'insensitive' },
          companyId: demoCompany.id,
        },
      });

      if (adminUser) {
        console.log('');
        console.log('Creating admin user for Four Ways Logistics...');
        const hashedPassword = await bcrypt.hash('password123', 10); // Default password - change after migration
        
        const newAdminUser = await prisma.user.create({
          data: {
            email: `admin@${fourWaysCompany.name.toLowerCase().replace(/\s+/g, '')}.com`,
            password: hashedPassword,
            firstName: adminUser.firstName || 'Admin',
            lastName: adminUser.lastName || 'User',
            phone: adminUser.phone,
            role: 'ADMIN',
            companyId: fourWaysCompany.id,
            isActive: true,
          },
        });

        console.log(`  ✓ Created admin user: ${newAdminUser.email}`);
        console.log(`  ⚠️  Default password: password123 (Please change after migration!)`);
      }
    }

    console.log('');
    console.log('✅ Four Ways Logistics company setup completed!');
    console.log('');
    console.log('You can now run the migration script:');
    console.log('  npm run db:migrate-demo');

    return fourWaysCompany;

  } catch (error) {
    console.error('❌ Error creating company:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createFourWaysCompany()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

