import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create or update demo company
  const company = await prisma.company.upsert({
    where: { dotNumber: '1234567' },
    update: {
      name: 'Demo Trucking Company',
      mcNumber: 'MC-123456',
      address: '123 Main Street',
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      phone: '555-0100',
      email: 'info@demotrucking.com',
      isActive: true,
    },
    create: {
      name: 'Demo Trucking Company',
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

  console.log('✅ Company created/updated:', company.name);

  // Create or update MC Number for the company
  let mcNumber = await prisma.mcNumber.findFirst({
    where: {
      companyId: company.id,
      number: 'MC-123456',
      deletedAt: null,
    },
  });

  if (!mcNumber) {
    mcNumber = await prisma.mcNumber.create({
      data: {
        companyId: company.id,
        number: 'MC-123456',
        companyName: company.name,
        type: 'CARRIER',
        isDefault: true,
        usdot: '1234567',
      },
    });
  } else {
    mcNumber = await prisma.mcNumber.update({
      where: { id: mcNumber.id },
      data: {
        companyName: company.name,
        type: 'CARRIER',
        isDefault: true,
        usdot: '1234567',
      },
    });
  }

  console.log('✅ MC Number created/updated:', mcNumber.number);

  // Create or update admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-0101',
      role: 'ADMIN',
      companyId: company.id,
      mcNumberId: mcNumber.id,
      isActive: true,
    },
    create: {
      email: 'admin@demo.com',
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

  console.log('✅ Admin user created/updated:', adminUser.email);

  // Create a sample dispatcher user
  const dispatcherPassword = await bcrypt.hash('dispatcher123', 10);
  const dispatcherUser = await prisma.user.upsert({
    where: { email: 'dispatcher@demo.com' },
    update: {
      password: dispatcherPassword,
      firstName: 'John',
      lastName: 'Dispatcher',
      phone: '555-0102',
      role: 'DISPATCHER',
      companyId: company.id,
      mcNumberId: mcNumber.id,
      isActive: true,
    },
    create: {
      email: 'dispatcher@demo.com',
      password: dispatcherPassword,
      firstName: 'John',
      lastName: 'Dispatcher',
      phone: '555-0102',
      role: 'DISPATCHER',
      companyId: company.id,
      mcNumberId: mcNumber.id,
      isActive: true,
    },
  });

  console.log('✅ Dispatcher user created/updated:', dispatcherUser.email);

  // Create a sample customer
  const customer = await prisma.customer.upsert({
    where: { customerNumber: 'C-001' },
    update: {
      name: 'ABC Logistics',
      type: 'DIRECT',
      address: '456 Customer Avenue',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      phone: '555-0200',
      email: 'billing@abclogistics.com',
      paymentTerms: 30,
      isActive: true,
    },
    create: {
      companyId: company.id,
      customerNumber: 'C-001',
      name: 'ABC Logistics',
      type: 'DIRECT',
      address: '456 Customer Avenue',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      phone: '555-0200',
      email: 'billing@abclogistics.com',
      paymentTerms: 30,
      isActive: true,
    },
  });

  console.log('✅ Sample customer created/updated:', customer.name);

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@demo.com');
  console.log('     Password: admin123');
  console.log('');
  console.log('   Dispatcher:');
  console.log('     Email: dispatcher@demo.com');
  console.log('     Password: dispatcher123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

