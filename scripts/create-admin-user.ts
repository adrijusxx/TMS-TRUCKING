import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 Creating admin user and company...');
  
  try {
    // Create company
    const company = await prisma.company.upsert({
      where: { dotNumber: '1234567' },
      update: {},
      create: {
        name: 'Four Ways Logistics Inc 2',
        dotNumber: '1234567',
        mcNumber: 'MC-160847',
        address: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        phone: '555-0100',
        email: 'info@fourwayslogistics.com',
        isActive: true,
      },
    });

    console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);

    // Create MC number for the company (needed before creating user)
    const mcNumber = await prisma.mcNumber.upsert({
      where: {
        companyId_number: {
          companyId: company.id,
          number: '160847',
        },
      },
      update: {},
      create: {
        companyId: company.id,
        companyName: 'FOUR WAYS LOGISTICS INC 2',
        number: '160847',
        type: 'CARRIER',
        isDefault: true,
        companyPhone: company.phone,
      },
    });

    console.log(`✅ MC Number created: ${mcNumber.companyName} (MC ${mcNumber.number})`);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@fourways.com' },
      update: {
        companyId: company.id,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        mcNumberId: mcNumber.id,
      },
      create: {
        email: 'admin@fourways.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '555-0101',
        role: 'ADMIN',
        companyId: company.id,
        mcNumberId: mcNumber.id,
        isActive: true,
      },
    });

    console.log(`✅ Admin user created!`);
    console.log('');
    console.log('📧 Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
    console.log('');
    console.log('⚠️  IMPORTANT: Please change this password after first login!');
    console.log('');
    console.log('✅ Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

