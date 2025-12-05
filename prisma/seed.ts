/**
 * Comprehensive Database Seed File
 * 
 * This seed file creates at least 3 examples of each main entity:
 * - 3 Companies
 * - 9 MC Numbers (3 per company)
 * - Multiple Users (3 of each role type per company)
 * - 9 Drivers (3 per company)
 * - 9 Trucks (3 per company)
 * - 9 Trailers (3 per company)
 * - 9 Customers (3 per company)
 * - 9 Loads with stops (3 per company)
 * - 9 Invoices (3 per company)
 * - 9 Settlements (3 per company)
 * - 9 Maintenance Records (3 per company)
 * - 9 Breakdowns (3 per company)
 * - 9 Safety Incidents (3 per company)
 * - 9 Documents (3 per company)
 * - 9 Locations (3 per company)
 * - 9 Vendors (3 per company)
 * - 9 Expense Categories (3 per company)
 * - 9 Expense Types (3 per company)
 * - 9 Deduction Rules (3 per company)
 * - 9 Accessorial Charges (3 per company)
 * 
 * Note: If you get TypeScript errors, regenerate Prisma client:
 *   npx prisma generate
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive examples...');
  console.log('');

  // ============================================
  // COMPANIES (3 examples)
  // ============================================
  console.log('📦 Creating companies...');
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { dotNumber: '1234567' },
      update: {},
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
    }),
    prisma.company.upsert({
      where: { dotNumber: '2345678' },
      update: {},
      create: {
        name: 'Elite Freight Solutions',
        dotNumber: '2345678',
        mcNumber: 'MC-234567',
        address: '456 Commerce Blvd',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        phone: '555-0200',
        email: 'contact@elitefreight.com',
        isActive: true,
      },
    }),
    prisma.company.upsert({
      where: { dotNumber: '3456789' },
      update: {},
      create: {
        name: 'Swift Logistics Group',
        dotNumber: '3456789',
        mcNumber: 'MC-345678',
        address: '789 Transport Way',
        city: 'San Antonio',
        state: 'TX',
        zip: '78201',
        phone: '555-0300',
        email: 'info@swiftlogistics.com',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // ============================================
  // MC NUMBERS (3 per company = 9 total)
  // ============================================
  console.log('🚛 Creating MC Numbers...');
  const mcNumbers: any[] = [];
  
  for (const company of companies) {
    const companyMcNumbers = await Promise.all([
      prisma.mcNumber.upsert({
        where: {
          companyId_number: {
            companyId: company.id,
            number: company.mcNumber || `MC-${company.dotNumber.slice(0, 6)}`,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          number: company.mcNumber || `MC-${company.dotNumber.slice(0, 6)}`,
          companyName: company.name,
          type: 'CARRIER',
          isDefault: true,
          usdot: company.dotNumber,
        },
      }),
      prisma.mcNumber.upsert({
        where: {
          companyId_number: {
            companyId: company.id,
            number: `${company.mcNumber || `MC-${company.dotNumber.slice(0, 6)}`}-A`,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          number: `${company.mcNumber || `MC-${company.dotNumber.slice(0, 6)}`}-A`,
          companyName: `${company.name} - Division A`,
          type: 'CARRIER',
          isDefault: false,
          usdot: company.dotNumber,
        },
      }),
      prisma.mcNumber.upsert({
        where: {
          companyId_number: {
            companyId: company.id,
            number: `${company.mcNumber || `MC-${company.dotNumber.slice(0, 6)}`}-B`,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          number: `${company.mcNumber || `MC-${company.dotNumber.slice(0, 6)}`}-B`,
          companyName: `${company.name} - Division B`,
          type: 'CARRIER',
          isDefault: false,
          usdot: company.dotNumber,
        },
      }),
    ]);
    mcNumbers.push(...companyMcNumbers);
  }

  console.log(`✅ Created ${mcNumbers.length} MC Numbers`);

  // ============================================
  // USERS (3 of each role type)
  // ============================================
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users: any[] = [];

  // Note: Regenerate Prisma client if you get type errors: npx prisma generate
  const roles: Array<'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER' | 'SAFETY' | 'FLEET'> = [
    'ADMIN',
    'DISPATCHER',
    'ACCOUNTANT',
    'DRIVER',
    'SAFETY',
    'FLEET',
  ];

  for (const company of companies) {
    const defaultMcNumber = mcNumbers.find(mc => mc.companyId === company.id && mc.isDefault);
    if (!defaultMcNumber) continue;

    for (const role of roles) {
      for (let i = 1; i <= 3; i++) {
        const email = `${role.toLowerCase()}${i}@${company.name.toLowerCase().replace(/\s+/g, '')}.com`;
        // Set mcAccess: empty array for admins (all access), or [mcNumberId] for others
        const mcAccess = role === 'ADMIN' ? [] : [defaultMcNumber.id];
        
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            password: hashedPassword,
            firstName: role,
            lastName: `User ${i}`,
            phone: `555-${1000 + i}`,
            role: role as any, // Type assertion - regenerate Prisma client if needed
            companyId: company.id,
            mcNumberId: defaultMcNumber.id,
            mcAccess: mcAccess, // Array of MC IDs user can access
            isActive: true,
          },
        });
        users.push(user);
      }
    }
  }

  console.log(`✅ Created ${users.length} users`);

  // ============================================
  // DRIVERS (3 per company = 9 total)
  // ============================================
  console.log('🚗 Creating drivers...');
  const drivers: any[] = [];

  for (const company of companies) {
    const defaultMcNumber = mcNumbers.find(mc => mc.companyId === company.id && mc.isDefault);
    if (!defaultMcNumber) continue;

    const driverUsers = users.filter(u => u.companyId === company.id && u.role === 'DRIVER').slice(0, 3);
    const dispatcher = users.find(u => u.companyId === company.id && u.role === 'DISPATCHER');
    const hrManager = users.find(u => u.companyId === company.id && u.role === 'HR');
    const safetyManager = users.find(u => u.companyId === company.id && u.role === 'SAFETY');

    for (let i = 0; i < driverUsers.length; i++) {
      const driverUser = driverUsers[i];
      const driverNumber = `DRV-${company.dotNumber.slice(0, 3)}-${String(i + 1).padStart(3, '0')}`;
      
      const driver = await prisma.driver.upsert({
        where: { driverNumber },
        update: {},
        create: {
          userId: driverUser.id,
          companyId: company.id,
          driverNumber,
          licenseNumber: `DL${company.dotNumber.slice(0, 6)}${i + 1}`,
          licenseState: 'TX',
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          medicalCardExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
          drugTestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          backgroundCheck: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          hireDate: new Date(Date.now() - (365 * (i + 1)) * 24 * 60 * 60 * 1000), // 1-3 years ago
          status: 'AVAILABLE',
          employeeStatus: 'ACTIVE',
          assignmentStatus: 'READY_TO_GO',
          payType: i === 0 ? 'PER_MILE' : i === 1 ? 'PERCENTAGE' : 'PER_LOAD',
          payRate: i === 0 ? 0.65 : i === 1 ? 25 : 1500,
          mcNumberId: defaultMcNumber.id,
          assignedDispatcherId: dispatcher?.id,
          hrManagerId: hrManager?.id,
          safetyManagerId: safetyManager?.id,
          homeTerminal: ['Dallas', 'Houston', 'San Antonio'][i],
          emergencyContact: `Emergency Contact ${i + 1}`,
          emergencyPhone: `555-9${100 + i}`,
          rating: 4.5 + (i * 0.1),
          totalLoads: (i + 1) * 50,
          totalMiles: (i + 1) * 50000,
          isActive: true,
        } as any,
      });
      drivers.push(driver);
    }
  }

  console.log(`✅ Created ${drivers.length} drivers`);

  // ============================================
  // TRUCKS (3 per company = 9 total)
  // ============================================
  console.log('🚚 Creating trucks...');
  const trucks: any[] = [];

  for (const company of companies) {
    const defaultMcNumber = mcNumbers.find(mc => mc.companyId === company.id && mc.isDefault);
    if (!defaultMcNumber) continue;

    for (let i = 1; i <= 3; i++) {
      const truckNumber = `TRK-${company.dotNumber.slice(0, 3)}-${String(i).padStart(3, '0')}`;
      const vin = `1HGBH41JXMN${company.dotNumber.slice(0, 6)}${i}`;
      
      const truck = await prisma.truck.upsert({
        where: { truckNumber },
        update: {},
        create: {
          companyId: company.id,
          truckNumber,
          vin,
          make: ['Freightliner', 'Peterbilt', 'Kenworth'][i - 1],
          model: ['Cascadia', '579', 'T680'][i - 1],
          year: 2020 + i,
          licensePlate: `TX-${company.dotNumber.slice(0, 3)}${i}`,
          state: 'TX',
          mcNumberId: defaultMcNumber.id,
          equipmentType: 'DRY_VAN',
          capacity: 45000,
          status: i === 1 ? 'AVAILABLE' : i === 2 ? 'IN_USE' : 'MAINTENANCE',
          odometerReading: (i * 100000),
          registrationExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          inspectionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          eldInstalled: true,
          gpsInstalled: true,
          isActive: true,
        } as any,
      });
      trucks.push(truck);
    }
  }

  console.log(`✅ Created ${trucks.length} trucks`);

  // ============================================
  // TRAILERS (3 per company = 9 total)
  // ============================================
  console.log('🚛 Creating trailers...');
  const trailers: any[] = [];

  for (const company of companies) {
    const defaultMcNumber = mcNumbers.find(mc => mc.companyId === company.id && mc.isDefault);
    if (!defaultMcNumber) continue;

    for (let i = 1; i <= 3; i++) {
      const trailerNumber = `TRL-${company.dotNumber.slice(0, 3)}-${String(i).padStart(3, '0')}`;
      
      const trailer = await prisma.trailer.upsert({
        where: { trailerNumber },
        update: {},
        create: {
          companyId: company.id,
          trailerNumber,
          vin: `1TRL${company.dotNumber.slice(0, 10)}${i}`,
          make: 'Utility',
          model: '3000R',
          year: 2019 + i,
          licensePlate: `TX-TRL${company.dotNumber.slice(0, 3)}${i}`,
          state: 'TX',
          mcNumberId: defaultMcNumber.id,
          type: 'DRY_VAN',
          status: i === 1 ? 'AVAILABLE' : i === 2 ? 'IN_USE' : 'MAINTENANCE',
          fleetStatus: 'ACTIVE',
          registrationExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          inspectionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isActive: true,
        } as any,
      });
      trailers.push(trailer);
    }
  }

  console.log(`✅ Created ${trailers.length} trailers`);

  // ============================================
  // CUSTOMERS (3 per company = 9 total)
  // ============================================
  console.log('🏢 Creating customers...');
  const customers: any[] = [];

  for (const company of companies) {
    for (let i = 1; i <= 3; i++) {
      const customerNumber = `CUST-${company.dotNumber.slice(0, 3)}-${String(i).padStart(3, '0')}`;
      
      const customer = await prisma.customer.upsert({
        where: { customerNumber },
        update: {},
        create: {
          companyId: company.id,
          customerNumber,
          name: `${['ABC Logistics', 'XYZ Shipping', 'Global Freight'][i - 1]} ${i}`,
          type: ['DIRECT', 'BROKER', 'DIRECT'][i - 1] as any,
          address: `${100 + i} Customer Street`,
          city: ['Dallas', 'Houston', 'San Antonio'][i - 1],
          state: 'TX',
          zip: `${75001 + i}`,
          phone: `555-${2000 + i}`,
          email: `billing@customer${i}.com`,
          paymentTerms: [30, 45, 15][i - 1],
          creditLimit: (i * 50000),
          isActive: true,
        },
      });
      customers.push(customer);
    }
  }

  console.log(`✅ Created ${customers.length} customers`);

  // ============================================
  // LOADS (3 per company = 9 total, with stops)
  // ============================================
  console.log('📦 Creating loads...');
  const loads: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyDrivers = drivers.filter(d => d.companyId === company.id);
    const companyTrucks = trucks.filter(t => t.companyId === company.id);
    const companyTrailers = trailers.filter(t => t.companyId === company.id);
    const companyCustomers = customers.filter(cust => cust.companyId === company.id);
    const dispatcher = users.find(u => u.companyId === company.id && u.role === 'DISPATCHER');
    const defaultMcNumber = mcNumbers.find(mc => mc.companyId === company.id && mc.isDefault);

    for (let i = 1; i <= 3; i++) {
      // Generate unique load number: include company index to ensure uniqueness
      const loadNumber = `LOAD-${company.dotNumber.slice(0, 3)}-${String((c * 3) + i).padStart(4, '0')}`;
      const driver = companyDrivers[i - 1];
      const truck = companyTrucks[i - 1];
      const trailer = companyTrailers[i - 1];
      const customer = companyCustomers[i - 1];

      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + i);
      const deliveryDate = new Date(pickupDate);
      deliveryDate.setDate(deliveryDate.getDate() + 2);

      // Use upsert to handle existing loads
      const loadData = {
        companyId: company.id,
        customerId: customer.id,
        driverId: driver?.id,
        truckId: truck?.id,
        trailerId: trailer?.id,
        dispatcherId: dispatcher?.id,
        mcNumberId: defaultMcNumber?.id, // Use mcNumberId instead of mcNumber string
        status: (i === 1 ? 'ASSIGNED' : i === 2 ? 'EN_ROUTE_PICKUP' : 'LOADED') as any,
        loadType: 'FTL' as any,
        equipmentType: 'DRY_VAN' as any,
        pickupLocation: `Pickup Location ${i}`,
        pickupAddress: `${200 + i} Pickup Street`,
        pickupCity: ['Dallas', 'Houston', 'San Antonio'][i - 1],
        pickupState: 'TX',
        pickupZip: `${75001 + i}`,
        pickupDate,
        pickupTimeStart: new Date(pickupDate.getTime() + 8 * 60 * 60 * 1000),
        pickupTimeEnd: new Date(pickupDate.getTime() + 12 * 60 * 60 * 1000),
        deliveryLocation: `Delivery Location ${i}`,
        deliveryAddress: `${300 + i} Delivery Street`,
        deliveryCity: ['Austin', 'Fort Worth', 'El Paso'][i - 1],
        deliveryState: 'TX',
        deliveryZip: `${78701 + i}`,
        deliveryDate,
        deliveryTimeStart: new Date(deliveryDate.getTime() + 14 * 60 * 60 * 1000),
        deliveryTimeEnd: new Date(deliveryDate.getTime() + 18 * 60 * 60 * 1000),
        weight: 40000 + (i * 1000),
        pieces: 20 + i,
        commodity: ['General Freight', 'Electronics', 'Food Products'][i - 1],
        revenue: 1500 + (i * 200),
        driverPay: 800 + (i * 100),
        totalMiles: 500 + (i * 50),
        loadedMiles: 450 + (i * 50),
        emptyMiles: 50,
      };

      const load = await prisma.load.upsert({
        where: { loadNumber },
        update: loadData,
        create: {
          loadNumber,
          ...loadData,
        },
      });

      // Delete existing stops for this load, then create new ones
      await prisma.loadStop.deleteMany({
        where: { loadId: load.id },
      });

      // Create stops for each load (2-3 stops)
      const stopCount = 2 + (i % 2);
      for (let s = 1; s <= stopCount; s++) {
        await prisma.loadStop.create({
          data: {
            loadId: load.id,
            sequence: s,
            stopType: s === 1 ? 'PICKUP' : s === stopCount ? 'DELIVERY' : 'PICKUP',
            company: `Stop ${s} Company`,
            address: `${400 + s} Stop Street`,
            city: ['Dallas', 'Houston', 'San Antonio', 'Austin'][(i + s) % 4],
            state: 'TX',
            zip: `${75001 + s}`,
            earliestArrival: new Date(pickupDate.getTime() + (s - 1) * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
            latestArrival: new Date(pickupDate.getTime() + (s - 1) * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
            totalWeight: Math.floor((40000 + (i * 1000)) / stopCount),
            totalPieces: Math.floor((20 + i) / stopCount),
          },
        });
      }

      loads.push(load);
    }
  }

  console.log(`✅ Created ${loads.length} loads with stops`);

  // ============================================
  // INVOICES (3 per company = 9 total)
  // ============================================
  console.log('💰 Creating invoices...');
  const invoices: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyLoads = loads.filter(l => l.companyId === company.id);
    const companyCustomers = customers.filter(cust => cust.companyId === company.id);

    for (let i = 0; i < 3 && i < companyLoads.length; i++) {
      const load = companyLoads[i];
      // Generate unique invoice number: include company index to ensure uniqueness
      const invoiceNumber = `INV-${company.dotNumber.slice(0, 3)}-${String((c * 3) + i + 1).padStart(4, '0')}`;
      
      const invoiceData = {
        companyId: company.id,
        loadIds: [load.id],
        loadId: load.id,
        customerId: load.customerId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: (i === 0 ? 'DRAFT' : i === 1 ? 'SENT' : 'PAID') as any,
        subtotal: load.revenue,
        tax: load.revenue * 0.08,
        total: load.revenue * 1.08,
        balance: i === 2 ? 0 : load.revenue * 1.08,
        amountPaid: i === 2 ? load.revenue * 1.08 : 0,
        paidDate: i === 2 ? new Date() : null,
      };
      
      const invoice = await prisma.invoice.upsert({
        where: { invoiceNumber },
        update: invoiceData,
        create: {
          invoiceNumber,
          ...invoiceData,
        },
      });
      invoices.push(invoice);
    }
  }

  console.log(`✅ Created ${invoices.length} invoices`);

  // ============================================
  // SETTLEMENTS (3 per company = 9 total)
  // ============================================
  console.log('💵 Creating settlements...');
  const settlements: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyDrivers = drivers.filter(d => d.companyId === company.id);
    const companyLoads = loads.filter(l => l.companyId === company.id && l.driverId);

    for (let i = 0; i < 3 && i < companyDrivers.length; i++) {
      const driver = companyDrivers[i];
      const driverLoads = companyLoads.filter(l => l.driverId === driver.id).slice(0, 3);
      
      if (driverLoads.length === 0) continue;

      // Generate unique settlement number: include company index to ensure uniqueness
      const settlementNumber = `SET-${company.dotNumber.slice(0, 3)}-${String((c * 3) + i + 1).padStart(4, '0')}`;
      const totalRevenue = driverLoads.reduce((sum, l) => sum + (l.revenue || 0), 0);
      const totalPay = driverLoads.reduce((sum, l) => sum + (l.driverPay || 0), 0);
      
      const settlementData = {
        driverId: driver.id,
        periodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        status: (i === 0 ? 'PENDING' : i === 1 ? 'PENDING' : 'APPROVED') as any,
        grossPay: totalPay,
        deductions: totalPay * 0.1,
        advances: 0,
        netPay: totalPay * 0.9,
        loadIds: driverLoads.map(l => l.id),
      };
      
      const settlement = await prisma.settlement.upsert({
        where: { settlementNumber },
        update: settlementData,
        create: {
          settlementNumber,
          ...settlementData,
        },
      });
      settlements.push(settlement);
    }
  }

  console.log(`✅ Created ${settlements.length} settlements`);

  // ============================================
  // MAINTENANCE RECORDS (3 per company = 9 total)
  // ============================================
  console.log('🔧 Creating maintenance records...');
  const maintenanceRecords: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyTrucks = trucks.filter(t => t.companyId === company.id);

    for (let i = 0; i < 3 && i < companyTrucks.length; i++) {
      const truck = companyTrucks[i];
      
      const maintenance = await prisma.maintenanceRecord.create({
        data: {
          companyId: company.id,
          truckId: truck.id,
          type: ['PM_A', 'PM_B', 'TIRES'][i] as any,
          description: `Maintenance ${i + 1} for ${truck.truckNumber}`,
          cost: 200 + (i * 100),
          odometer: truck.odometerReading + (i * 1000),
          date: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000),
          nextServiceDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
          status: 'COMPLETED',
        },
      });
      maintenanceRecords.push(maintenance);
    }
  }

  console.log(`✅ Created ${maintenanceRecords.length} maintenance records`);

  // ============================================
  // BREAKDOWNS (3 per company = 9 total)
  // ============================================
  console.log('⚠️ Creating breakdowns...');
  const breakdowns: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyTrucks = trucks.filter(t => t.companyId === company.id);
    const companyDrivers = drivers.filter(d => d.companyId === company.id);

    for (let i = 0; i < 3 && i < companyTrucks.length; i++) {
      const truck = companyTrucks[i];
      const driver = companyDrivers[i];
      
      // Generate unique breakdown number: include company index to ensure uniqueness
      const breakdownNumber = `BD-${company.dotNumber.slice(0, 3)}-${String((c * 3) + i + 1).padStart(4, '0')}`;
      
      const breakdownData = {
        companyId: company.id,
        truckId: truck.id,
        driverId: driver?.id,
        breakdownType: ['ENGINE_FAILURE', 'ELECTRICAL_ISSUE', 'TIRE_FLAT'][i] as any,
        description: `Breakdown ${i + 1} - ${['Engine failure', 'Battery issue', 'Flat tire'][i]}`,
        location: `${500 + i} Highway Road`,
        city: ['Dallas', 'Houston', 'San Antonio'][i],
        state: 'TX',
        reportedAt: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000),
        odometerReading: truck.odometerReading + (i * 1000),
        totalCost: 500 + (i * 200),
        status: (i === 0 ? 'REPORTED' : 'RESOLVED') as any,
      };
      
      const breakdown = await prisma.breakdown.upsert({
        where: { breakdownNumber },
        update: breakdownData,
        create: {
          breakdownNumber,
          ...breakdownData,
        },
      });
      breakdowns.push(breakdown);
    }
  }

  console.log(`✅ Created ${breakdowns.length} breakdowns`);

  // ============================================
  // SAFETY INCIDENTS (3 per company = 9 total)
  // ============================================
  console.log('🚨 Creating safety incidents...');
  const safetyIncidents: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyDrivers = drivers.filter(d => d.companyId === company.id);

    for (let i = 0; i < 3 && i < companyDrivers.length; i++) {
      const driver = companyDrivers[i];
      
      // Generate unique incident number: include company index to ensure uniqueness
      const incidentNumber = `SI-${company.dotNumber.slice(0, 3)}-${String((c * 3) + i + 1).padStart(4, '0')}`;
      
      const incidentData = {
        companyId: company.id,
        driverId: driver.id,
        incidentType: ['ACCIDENT', 'COLLISION', 'DRIVER_ERROR'][i] as any,
        severity: ['MINOR', 'MODERATE', 'MAJOR'][i] as any,
        description: `Safety incident ${i + 1} - ${['Rear-end collision', 'Speeding violation', 'Close call'][i]}`,
        location: `${600 + i} Safety Street`,
        city: ['Dallas', 'Houston', 'San Antonio'][i],
        state: 'TX',
        date: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000),
        status: (i === 0 ? 'UNDER_INVESTIGATION' : i === 1 ? 'RESOLVED' : 'CLOSED') as any,
      };
      
      const incident = await prisma.safetyIncident.upsert({
        where: { incidentNumber },
        update: incidentData,
        create: {
          incidentNumber,
          ...incidentData,
        },
      });
      safetyIncidents.push(incident);
    }
  }

  console.log(`✅ Created ${safetyIncidents.length} safety incidents`);

  // ============================================
  // DOCUMENTS (3 per company = 9 total)
  // ============================================
  console.log('📄 Creating documents...');
  const documents: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyLoads = loads.filter(l => l.companyId === company.id);

    for (let i = 0; i < 3 && i < companyLoads.length; i++) {
      const load = companyLoads[i];
      
      const dispatcher = users.find(u => u.companyId === company.id && u.role === 'DISPATCHER');
      const document = await prisma.document.create({
        data: {
          companyId: company.id,
          loadId: load.id,
          type: ['POD', 'BOL', 'INVOICE'][i] as any,
          title: `Document ${i + 1} for ${load.loadNumber}`,
          fileName: `document-${load.loadNumber}-${i + 1}.pdf`,
          fileUrl: `/documents/${load.loadNumber}-${i + 1}.pdf`,
          fileSize: 1024 * (100 + i),
          mimeType: 'application/pdf',
          uploadedBy: dispatcher?.id || users[0].id,
        },
      });
      documents.push(document);
    }
  }

  console.log(`✅ Created ${documents.length} documents`);

  // ============================================
  // LOCATIONS (3 per company = 9 total)
  // ============================================
  console.log('📍 Creating locations...');
  const locations: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];

    for (let i = 1; i <= 3; i++) {
      const location = await prisma.location.create({
        data: {
          companyId: company.id,
          name: `Location ${i} - ${['Warehouse', 'Warehouse', 'Terminal'][i - 1]}`,
          address: `${700 + i} Location Street`,
          city: ['Dallas', 'Houston', 'San Antonio'][i - 1],
          state: 'TX',
          zip: `${75001 + i}`,
          type: (['WAREHOUSE', 'WAREHOUSE', 'TERMINAL'][i - 1]) as any,
          isActive: true,
        },
      });
      locations.push(location);
    }
  }

  console.log(`✅ Created ${locations.length} locations`);

  // ============================================
  // VENDORS (3 per company = 9 total)
  // ============================================
  console.log('🏪 Creating vendors...');
  const vendors: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];

    for (let i = 1; i <= 3; i++) {
      // Generate unique vendor number: include company index to ensure uniqueness
      const vendorNumber = `VEND-${company.dotNumber.slice(0, 3)}-${String((c * 3) + i).padStart(3, '0')}`;
      
      const vendorData = {
        companyId: company.id,
        name: `${['Fuel Supplier', 'Parts Store', 'Service Center'][i - 1]} ${i}`,
        type: (['FUEL_VENDOR', 'PARTS_VENDOR', 'REPAIR_SHOP'][i - 1]) as any,
        address: `${800 + i} Vendor Street`,
        city: ['Dallas', 'Houston', 'San Antonio'][i - 1],
        state: 'TX',
        zip: `${75001 + i}`,
        phone: `555-${3000 + i}`,
        email: `contact@vendor${(c * 3) + i}.com`,
        paymentTerms: [15, 30, 45][i - 1],
        isActive: true,
      };
      
      const vendor = await prisma.vendor.upsert({
        where: { vendorNumber },
        update: vendorData,
        create: {
          vendorNumber,
          ...vendorData,
        },
      });
      vendors.push(vendor);
    }
  }

  console.log(`✅ Created ${vendors.length} vendors`);

  // ============================================
  // EXPENSE CATEGORIES (3 per company = 9 total)
  // ============================================
  console.log('📊 Creating expense categories...');
  const expenseCategories: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];

    for (let i = 1; i <= 3; i++) {
      const category = await prisma.expenseCategory.create({
        data: {
          companyId: company.id,
          name: ['Fuel', 'Maintenance', 'Tolls'][i - 1],
          description: `Expense category for ${['fuel expenses', 'maintenance costs', 'toll charges'][i - 1]}`,
          isActive: true,
        },
      });
      expenseCategories.push(category);
    }
  }

  console.log(`✅ Created ${expenseCategories.length} expense categories`);

  // ============================================
  // EXPENSE TYPES (3 per company = 9 total)
  // ============================================
  console.log('💳 Creating expense types...');
  const expenseTypes: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyCategories = expenseCategories.filter(ec => ec.companyId === company.id);

    for (let i = 0; i < 3 && i < companyCategories.length; i++) {
      const category = companyCategories[i];
      
      const expenseType = await prisma.expenseType.create({
        data: {
          companyId: company.id,
          categoryId: category.id,
          name: `${category.name} - ${['Type A', 'Type B', 'Type C'][i]}`,
          description: `Expense type ${i + 1} under ${category.name}`,
          isActive: true,
        },
      });
      expenseTypes.push(expenseType);
    }
  }

  console.log(`✅ Created ${expenseTypes.length} expense types`);

  // ============================================
  // DEDUCTION RULES (3 per company = 9 total)
  // ============================================
  console.log('📋 Creating deduction rules...');
  const deductionRules: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];

    for (let i = 1; i <= 3; i++) {
      const rule = await (prisma as any).deductionRule.create({
        data: {
          companyId: company.id,
          name: `${['Insurance', 'Escrow', 'Equipment'][i - 1]} Deduction`,
          notes: `Deduction rule ${i} for ${['insurance premiums', 'escrow deposits', 'equipment fees'][i - 1]}`,
          deductionType: (['INSURANCE', 'ESCROW', 'EQUIPMENT_RENTAL'][i - 1]) as any,
          calculationType: (i === 2 ? 'PERCENTAGE' : 'FIXED') as any,
          amount: i === 2 ? undefined : 100 * i,
          percentage: i === 2 ? 5 : undefined,
          frequency: 'PER_SETTLEMENT' as any,
          isActive: true,
        },
      });
      deductionRules.push(rule);
    }
  }

  console.log(`✅ Created ${deductionRules.length} deduction rules`);

  // ============================================
  // ACCESSORIAL CHARGES (3 per company = 9 total)
  // ============================================
  console.log('💼 Creating accessorial charges...');
  const accessorialCharges: any[] = [];

  for (let c = 0; c < companies.length; c++) {
    const company = companies[c];
    const companyLoads = loads.filter(l => l.companyId === company.id);

    for (let i = 0; i < 3 && i < companyLoads.length; i++) {
      const load = companyLoads[i];
      
      const charge = await prisma.accessorialCharge.create({
        data: {
          companyId: company.id,
          loadId: load.id,
          chargeType: (['DETENTION', 'LAYOVER', 'FUEL_SURCHARGE'][i]) as any,
          description: `Accessorial charge ${i + 1} for ${load.loadNumber}`,
          amount: 50 + (i * 25),
          status: (i > 0 ? 'APPROVED' : 'PENDING') as any,
          approvedById: i > 0 ? users.find(u => u.companyId === company.id && u.role === 'ACCOUNTANT')?.id : null,
          approvedAt: i > 0 ? new Date() : null,
        },
      });
      accessorialCharges.push(charge);
    }
  }

  console.log(`✅ Created ${accessorialCharges.length} accessorial charges`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Companies: ${companies.length}`);
  console.log(`   MC Numbers: ${mcNumbers.length}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Drivers: ${drivers.length}`);
  console.log(`   Trucks: ${trucks.length}`);
  console.log(`   Trailers: ${trailers.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Loads: ${loads.length}`);
  console.log(`   Invoices: ${invoices.length}`);
  console.log(`   Settlements: ${settlements.length}`);
  console.log(`   Maintenance Records: ${maintenanceRecords.length}`);
  console.log(`   Breakdowns: ${breakdowns.length}`);
  console.log(`   Safety Incidents: ${safetyIncidents.length}`);
  console.log(`   Documents: ${documents.length}`);
  console.log(`   Locations: ${locations.length}`);
  console.log(`   Vendors: ${vendors.length}`);
  console.log(`   Expense Categories: ${expenseCategories.length}`);
  console.log(`   Expense Types: ${expenseTypes.length}`);
  console.log(`   Deduction Rules: ${deductionRules.length}`);
  console.log(`   Accessorial Charges: ${accessorialCharges.length}`);
  console.log('');
  console.log('🔑 Login Credentials (all passwords: password123):');
  console.log('   Admin: admin1@demotruckingcompany.com');
  console.log('   Dispatcher: dispatcher1@demotruckingcompany.com');
  console.log('   Driver: driver1@demotruckingcompany.com');
  console.log('   Accountant: accountant1@demotruckingcompany.com');
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
