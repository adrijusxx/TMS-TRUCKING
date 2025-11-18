import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create company
  const company = await prisma.company.upsert({
    where: { dotNumber: '1234567' },
    update: {},
    create: {
      name: 'Demo Trucking LLC',
      dotNumber: '1234567',
      mcNumber: 'MC-123456',
      address: '123 Main St',
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      phone: '555-0100',
      email: 'office@demotrucking.com'
    }
  });

  console.log('✅ Company created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-0101',
      role: 'ADMIN',
      companyId: company.id
    }
  });

  console.log('✅ Admin user created - Email: admin@demo.com, Password: admin123');

  // Create dispatcher
  await prisma.user.upsert({
    where: { email: 'dispatcher@demo.com' },
    update: {},
    create: {
      email: 'dispatcher@demo.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Dispatcher',
      phone: '555-0102',
      role: 'DISPATCHER',
      companyId: company.id
    }
  });

  console.log('✅ Dispatcher created');

  // Create sample customer (use upsert to handle existing records)
  const customer = await prisma.customer.upsert({
    where: {
      companyId_customerNumber: {
        companyId: company.id,
        customerNumber: 'C-001'
      }
    },
    update: {},
    create: {
      customerNumber: 'C-001',
      name: 'ABC Corporation',
      type: 'DIRECT',
      address: '456 Customer Ave',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      phone: '555-0200',
      email: 'billing@abccorp.com',
      paymentTerms: 30,
      companyId: company.id
    }
  });

  console.log('✅ Sample customer created');

  // Create sample trucks (use upsert to handle existing records)
  for (let i = 1; i <= 5; i++) {
    await prisma.truck.upsert({
      where: {
        companyId_truckNumber: {
          companyId: company.id,
          truckNumber: `T-10${i}`
        }
      },
      update: {},
      create: {
        truckNumber: `T-10${i}`,
        vin: `1HGBH41JXMN10918${i}`,
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2022,
        licensePlate: `TX-ABC${i}23`,
        state: 'TX',
        equipmentType: i % 2 === 0 ? 'REEFER' : 'DRY_VAN',
        capacity: 45000,
        status: 'AVAILABLE',
        registrationExpiry: new Date('2025-12-31'),
        insuranceExpiry: new Date('2025-12-31'),
        inspectionExpiry: new Date('2025-06-30'),
        companyId: company.id
      }
    });
  }

  console.log('✅ 5 sample trucks created');

  // Create sample drivers (use upsert to handle existing records)
  for (let i = 1; i <= 10; i++) {
    const driverUser = await prisma.user.upsert({
      where: { email: `driver${i}@demo.com` },
      update: {},
      create: {
        email: `driver${i}@demo.com`,
        password: hashedPassword,
        firstName: `Driver`,
        lastName: `${i}`,
        phone: `555-030${i}`,
        role: 'DRIVER',
        companyId: company.id
      }
    });

    await prisma.driver.upsert({
      where: {
        companyId_driverNumber: {
          companyId: company.id,
          driverNumber: `D-00${i}`
        }
      },
      update: {},
      create: {
        userId: driverUser.id,
        companyId: company.id,
        driverNumber: `D-00${i}`,
        licenseNumber: `TX-${100000 + i}`,
        licenseState: 'TX',
        licenseExpiry: new Date('2026-12-31'),
        medicalCardExpiry: new Date('2025-12-31'),
        status: 'AVAILABLE',
        payType: 'PER_MILE',
        payRate: 0.50
      }
    });
  }

  console.log('✅ 10 sample drivers created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

