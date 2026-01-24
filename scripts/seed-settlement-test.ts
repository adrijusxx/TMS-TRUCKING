/**
 * Settlement Test Workflow Seed Script
 * 
 * Creates comprehensive test data for settlement accounting workflow:
 * - 3 Trucks (Freightliner, Kenworth, Peterbilt)
 * - 3 Trailers (Dry Van, Reefer, Flatbed)
 * - 3 Drivers with full profiles and assignments
 * - Recurrent deduction rules (insurance, ELD, lease, escrow)
 * - Test loads (3-5 per driver, DELIVERED status)
 * - Load expenses (fuel advances, tolls, lumper fees)
 * - Driver advances (cash advances)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding settlement test data...\n');

    // ============================================
    // STEP 1: Get or Create Company & MC Number
    // ============================================
    console.log('📦 Setting up company and MC Number...');

    const company = await prisma.company.upsert({
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
    });

    const mcNumber = await prisma.mcNumber.upsert({
        where: {
            companyId_number: {
                companyId: company.id,
                number: company.mcNumber || 'MC-123456',
            },
        },
        update: {},
        create: {
            companyId: company.id,
            number: company.mcNumber || 'MC-123456',
            companyName: company.name,
            type: 'CARRIER',
            isDefault: true,
            usdot: company.dotNumber,
        },
    });

    console.log(`✅ Company: ${company.name}`);
    console.log(`✅ MC Number: ${mcNumber.number}\n`);

    // ============================================
    // STEP 2: Create Test Users (Dispatcher, Admin)
    // ============================================
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@demotrucking.com' },
        update: {},
        create: {
            email: 'admin@demotrucking.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            phone: '555-1001',
            role: 'ADMIN',
            companyId: company.id,
            mcNumberId: mcNumber.id,
            mcAccess: [], // Admin has access to all MCs
            isActive: true,
        },
    });

    const dispatcher = await prisma.user.upsert({
        where: { email: 'dispatcher@demotrucking.com' },
        update: {},
        create: {
            email: 'dispatcher@demotrucking.com',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Dispatcher',
            phone: '555-1002',
            role: 'DISPATCHER',
            companyId: company.id,
            mcNumberId: mcNumber.id,
            mcAccess: [mcNumber.id],
            isActive: true,
        },
    });

    console.log(`✅ Created admin and dispatcher users\n`);

    // ============================================
    // STEP 3: Create 3 Trucks
    // ============================================
    console.log('🚚 Creating trucks...');

    const truckData = [
        { number: 'TRK-001', make: 'Freightliner', model: 'Cascadia', year: 2021, vin: '1FUJGHDV0MLBZ1234' },
        { number: 'TRK-002', make: 'Kenworth', model: 'T680', year: 2022, vin: '1XKYDP9X0MJ123456' },
        { number: 'TRK-003', make: 'Peterbilt', model: '579', year: 2023, vin: '1XPBDP9X0ND123789' },
    ];

    const trucks = [];
    for (const data of truckData) {
        const truck = await prisma.truck.upsert({
            where: {
                companyId_truckNumber: {
                    companyId: company.id,
                    truckNumber: data.number,
                },
            },
            update: {},
            create: {
                companyId: company.id,
                truckNumber: data.number,
                vin: data.vin,
                make: data.make,
                model: data.model,
                year: data.year,
                licensePlate: `TX-${data.number}`,
                state: 'TX',
                mcNumberId: mcNumber.id,
                equipmentType: 'DRY_VAN',
                capacity: 45000,
                status: 'AVAILABLE',
                odometerReading: 50000,
                registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                inspectionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                eldInstalled: true,
                gpsInstalled: true,
                isActive: true,
            },
        });
        trucks.push(truck);
        console.log(`  ✅ ${truck.truckNumber} - ${truck.make} ${truck.model}`);
    }
    console.log('');

    // ============================================
    // STEP 4: Create 3 Trailers
    // ============================================
    console.log('🚛 Creating trailers...');

    const trailerData = [
        { number: 'TRL-001', type: 'Dry Van', make: 'Utility', model: '3000R', year: 2020 },
        { number: 'TRL-002', type: 'Reefer', make: 'Great Dane', model: 'Everest', year: 2021 },
        { number: 'TRL-003', type: 'Flatbed', make: 'Fontaine', model: 'Revolution', year: 2022 },
    ];

    const trailers = [];
    for (const data of trailerData) {
        const trailer = await prisma.trailer.upsert({
            where: {
                companyId_trailerNumber: {
                    companyId: company.id,
                    trailerNumber: data.number,
                },
            },
            update: {},
            create: {
                companyId: company.id,
                trailerNumber: data.number,
                vin: `1TRL${company.dotNumber}${data.number.slice(-3)}`,
                make: data.make,
                model: data.model,
                year: data.year,
                licensePlate: `TX-${data.number}`,
                state: 'TX',
                mcNumberId: mcNumber.id,
                type: data.type,
                status: 'AVAILABLE',
                fleetStatus: 'ACTIVE',
                registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                inspectionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                isActive: true,
            },
        });
        trailers.push(trailer);
        console.log(`  ✅ ${trailer.trailerNumber} - ${data.type}`);
    }
    console.log('');

    // ============================================
    // STEP 5: Create 3 Drivers with Full Profiles
    // ============================================
    console.log('🚗 Creating drivers...');

    const driverData = [
        {
            number: 'DRV-001',
            firstName: 'Michael',
            lastName: 'Johnson',
            email: 'michael.johnson@demotrucking.com',
            payRate: 0.65,
            ssn: '123-45-6789',
            dob: new Date('1985-03-15'),
            hireDate: new Date('2022-01-15'),
        },
        {
            number: 'DRV-002',
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'sarah.williams@demotrucking.com',
            payRate: 0.60,
            ssn: '234-56-7890',
            dob: new Date('1990-07-22'),
            hireDate: new Date('2021-06-10'),
        },
        {
            number: 'DRV-003',
            firstName: 'David',
            lastName: 'Martinez',
            email: 'david.martinez@demotrucking.com',
            payRate: 0.65,
            ssn: '345-67-8901',
            dob: new Date('1988-11-30'),
            hireDate: new Date('2023-03-20'),
        },
    ];

    const drivers = [];
    for (let i = 0; i < driverData.length; i++) {
        const data = driverData[i];

        // Create user for driver
        const driverUser = await prisma.user.upsert({
            where: { email: data.email },
            update: {},
            create: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: `555-200${i + 1}`,
                role: 'DRIVER',
                companyId: company.id,
                mcNumberId: mcNumber.id,
                mcAccess: [mcNumber.id],
                isActive: true,
            },
        });

        // Create driver profile
        const driver = await prisma.driver.upsert({
            where: {
                companyId_driverNumber: {
                    companyId: company.id,
                    driverNumber: data.number,
                },
            },
            update: {},
            create: {
                userId: driverUser.id,
                companyId: company.id,
                driverNumber: data.number,
                licenseNumber: `DL${data.number.replace('DRV-', '')}`,
                licenseState: 'TX',
                licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                licenseIssueDate: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000), // 3 years ago
                socialSecurityNumber: data.ssn,
                birthDate: data.dob,
                hireDate: data.hireDate,
                medicalCardExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
                drugTestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                backgroundCheck: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
                status: 'AVAILABLE',
                employeeStatus: 'ACTIVE',
                assignmentStatus: 'READY_TO_GO',
                payType: 'PER_MILE',
                payRate: data.payRate,
                mcNumberId: mcNumber.id,
                assignedDispatcherId: dispatcher.id,
                currentTruckId: trucks[i].id,
                currentTrailerId: trailers[i].id,
                homeTerminal: 'Dallas, TX',
                emergencyContact: `Emergency Contact ${i + 1}`,
                emergencyPhone: `555-900${i + 1}`,
                isActive: true,
                dlClass: 'A',
                endorsements: ['N', 'T'],
                driverType: i === 1 ? 'LEASE' : 'COMPANY_DRIVER', // Driver 2 is lease
            },
        });

        drivers.push(driver);
        console.log(`  ✅ ${driver.driverNumber} - ${data.firstName} ${data.lastName} ($${data.payRate}/mile)`);
    }
    console.log('');

    // ============================================
    // STEP 6: Create Recurrent Deduction Rules
    // ============================================
    console.log('💰 Creating recurrent deduction rules...');

    // Driver 1 (DRV-001): Insurance, ELD, Escrow
    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[0].id,
            name: `Weekly Insurance - ${drivers[0].driverNumber}`,
            deductionType: 'INSURANCE',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 150,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[0].id,
            name: `ELD Subscription - ${drivers[0].driverNumber}`,
            deductionType: 'FUEL_CARD_FEE', // Using available enum value
            isAddition: false,
            calculationType: 'FIXED',
            amount: 25,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[0].id,
            name: `Escrow - ${drivers[0].driverNumber}`,
            deductionType: 'ESCROW',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 100,
            goalAmount: 2500,
            currentAmount: 0,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    console.log(`  ✅ ${drivers[0].driverNumber}: Insurance $150/wk, ELD $25/wk, Escrow $100/wk (goal: $2,500)`);

    // Driver 2 (DRV-002): Lease, Insurance, ELD
    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[1].id,
            name: `Weekly Lease Payment - ${drivers[1].driverNumber}`,
            deductionType: 'OTHER', // Using OTHER for lease
            isAddition: false,
            calculationType: 'FIXED',
            amount: 400,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[1].id,
            name: `Weekly Insurance - ${drivers[1].driverNumber}`,
            deductionType: 'INSURANCE',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 175,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[1].id,
            name: `ELD Subscription - ${drivers[1].driverNumber}`,
            deductionType: 'FUEL_CARD_FEE',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 30,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    console.log(`  ✅ ${drivers[1].driverNumber}: Lease $400/wk, Insurance $175/wk, ELD $30/wk`);

    // Driver 3 (DRV-003): Insurance, Maintenance, Escrow
    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[2].id,
            name: `Weekly Insurance - ${drivers[2].driverNumber}`,
            deductionType: 'INSURANCE',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 125,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[2].id,
            name: `Truck Maintenance Fund - ${drivers[2].driverNumber}`,
            deductionType: 'OTHER',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 75,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    await prisma.deductionRule.create({
        data: {
            companyId: company.id,
            driverId: drivers[2].id,
            name: `Escrow - ${drivers[2].driverNumber}`,
            deductionType: 'ESCROW',
            isAddition: false,
            calculationType: 'FIXED',
            amount: 150,
            goalAmount: 3000,
            currentAmount: 0,
            deductionFrequency: 'WEEKLY',
            isActive: true,
        },
    });

    console.log(`  ✅ ${drivers[2].driverNumber}: Insurance $125/wk, Maintenance $75/wk, Escrow $150/wk (goal: $3,000)`);
    console.log('');

    // ============================================
    // STEP 7: Create Customer
    // ============================================
    console.log('🏢 Creating customer...');

    const customer = await prisma.customer.upsert({
        where: {
            companyId_customerNumber: {
                companyId: company.id,
                customerNumber: 'CUST-001',
            },
        },
        update: {},
        create: {
            companyId: company.id,
            customerNumber: 'CUST-001',
            name: 'ABC Logistics',
            type: 'BROKER',
            address: '456 Customer Street',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            phone: '555-3001',
            email: 'billing@abclogistics.com',
            paymentTerms: 30,
            creditLimit: 100000,
            isActive: true,
        },
    });

    console.log(`  ✅ ${customer.name}\n`);

    // ============================================
    // STEP 8: Create Test Loads (3-5 per driver)
    // ============================================
    console.log('📦 Creating test loads...');

    const loadLocations = [
        { pickup: 'Dallas, TX', delivery: 'Houston, TX', miles: 240 },
        { pickup: 'Houston, TX', delivery: 'San Antonio, TX', miles: 197 },
        { pickup: 'San Antonio, TX', delivery: 'Austin, TX', miles: 80 },
        { pickup: 'Austin, TX', delivery: 'El Paso, TX', miles: 580 },
        { pickup: 'El Paso, TX', delivery: 'Dallas, TX', miles: 625 },
    ];

    const loads = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (let driverIdx = 0; driverIdx < drivers.length; driverIdx++) {
        const driver = drivers[driverIdx];
        const numLoads = 3 + (driverIdx % 3); // 3, 4, or 5 loads

        for (let loadIdx = 0; loadIdx < numLoads; loadIdx++) {
            const location = loadLocations[loadIdx % loadLocations.length];
            const loadNumber = `LOAD-TEST-${driver.driverNumber}-${String(loadIdx + 1).padStart(2, '0')}`;

            // Spread loads across the week
            const daysAgo = 7 - Math.floor((loadIdx / numLoads) * 7);
            const deliveredAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            const pickupDate = new Date(deliveredAt.getTime() - 1 * 24 * 60 * 60 * 1000);

            const revenue = location.miles * (1.80 + Math.random() * 0.40); // $1.80-$2.20/mile

            const load = await prisma.load.upsert({
                where: {
                    companyId_loadNumber: {
                        companyId: company.id,
                        loadNumber,
                    },
                },
                update: {},
                create: {
                    companyId: company.id,
                    loadNumber,
                    customerId: customer.id,
                    driverId: driver.id,
                    truckId: trucks[driverIdx].id,
                    trailerId: trailers[driverIdx].id,
                    dispatcherId: dispatcher.id,
                    mcNumberId: mcNumber.id,
                    status: 'DELIVERED',
                    loadType: 'FTL',
                    equipmentType: 'DRY_VAN',
                    pickupLocation: location.pickup,
                    pickupCity: location.pickup.split(',')[0],
                    pickupState: 'TX',
                    pickupDate,
                    deliveryLocation: location.delivery,
                    deliveryCity: location.delivery.split(',')[0],
                    deliveryState: 'TX',
                    deliveryDate: deliveredAt,
                    deliveredAt,
                    weight: 40000,
                    commodity: 'General Freight',
                    revenue,
                    loadedMiles: location.miles,
                    emptyMiles: 0,
                    totalMiles: location.miles,
                    readyForSettlement: true,
                    podUploadedAt: deliveredAt,
                },
            });

            loads.push(load);
        }

        console.log(`  ✅ ${driver.driverNumber}: ${numLoads} loads created`);
    }
    console.log('');

    // ============================================
    // STEP 9: Create Load Expenses
    // ============================================
    console.log('💵 Creating load expenses...');

    let expenseCount = 0;
    for (const load of loads) {
        // Fuel advance (most loads)
        if (Math.random() > 0.2) {
            await prisma.loadExpense.create({
                data: {
                    loadId: load.id,
                    expenseType: 'OTHER', // Fuel advance
                    category: 'Fuel Advance',
                    amount: 200 + Math.random() * 300, // $200-$500
                    description: 'Fuel advance',
                    date: load.pickupDate || new Date(),
                    approvalStatus: 'APPROVED',
                    approvedById: admin.id,
                    approvedAt: new Date(),
                },
            });
            expenseCount++;
        }

        // Tolls (some loads)
        if (Math.random() > 0.5) {
            await prisma.loadExpense.create({
                data: {
                    loadId: load.id,
                    expenseType: 'TOLL',
                    amount: 50 + Math.random() * 100, // $50-$150
                    description: 'Highway tolls',
                    date: load.pickupDate || new Date(),
                    reimbursable: true, // Tolls are reimbursable
                    approvalStatus: 'APPROVED',
                    approvedById: admin.id,
                    approvedAt: new Date(),
                },
            });
            expenseCount++;
        }

        // Scale tickets (most loads)
        if (Math.random() > 0.3) {
            await prisma.loadExpense.create({
                data: {
                    loadId: load.id,
                    expenseType: 'SCALE',
                    amount: 10 + Math.random() * 5, // $10-$15
                    description: 'Scale ticket',
                    date: load.pickupDate || new Date(),
                    reimbursable: true, // Scale tickets are reimbursable
                    approvalStatus: 'APPROVED',
                    approvedById: admin.id,
                    approvedAt: new Date(),
                },
            });
            expenseCount++;
        }

        // Lumper fees (some loads)
        if (Math.random() > 0.6) {
            await prisma.loadExpense.create({
                data: {
                    loadId: load.id,
                    expenseType: 'LUMPER',
                    amount: 75 + Math.random() * 125, // $75-$200
                    description: 'Lumper service',
                    date: load.deliveryDate || new Date(),
                    approvalStatus: 'APPROVED',
                    approvedById: admin.id,
                    approvedAt: new Date(),
                },
            });
            expenseCount++;
        }
    }

    console.log(`  ✅ Created ${expenseCount} load expenses\n`);

    // ============================================
    // STEP 10: Create Driver Advances
    // ============================================
    console.log('💸 Creating driver advances...');

    let advanceCount = 0;
    for (const driver of drivers) {
        const driverLoads = loads.filter(l => l.driverId === driver.id);

        // Create 1-2 advances per driver
        const numAdvances = 1 + Math.floor(Math.random() * 2);

        for (let i = 0; i < numAdvances && i < driverLoads.length; i++) {
            const load = driverLoads[i];

            await prisma.driverAdvance.create({
                data: {
                    driverId: driver.id,
                    loadId: load.id,
                    amount: 300 + Math.random() * 500, // $300-$800
                    requestDate: new Date(load.pickupDate!.getTime() - 1 * 24 * 60 * 60 * 1000),
                    approvalStatus: 'APPROVED',
                    approvedById: admin.id,
                    approvedAt: new Date(load.pickupDate!.getTime() - 1 * 24 * 60 * 60 * 1000),
                    paymentMethod: 'CASH',
                    paidAt: load.pickupDate,
                    notes: 'Cash advance for trip',
                },
            });

            advanceCount++;
        }
    }

    console.log(`  ✅ Created ${advanceCount} driver advances\n`);

    // ============================================
    // Summary
    // ============================================
    console.log('✨ Settlement test data seeding complete!\n');
    console.log('Summary:');
    console.log(`  - Company: ${company.name}`);
    console.log(`  - MC Number: ${mcNumber.number}`);
    console.log(`  - Trucks: ${trucks.length}`);
    console.log(`  - Trailers: ${trailers.length}`);
    console.log(`  - Drivers: ${drivers.length}`);
    console.log(`  - Loads: ${loads.length}`);
    console.log(`  - Load Expenses: ${expenseCount}`);
    console.log(`  - Driver Advances: ${advanceCount}`);
    console.log(`  - Deduction Rules: 9 (3 per driver)`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run: tsx scripts/test-settlement-workflow.ts');
    console.log('  2. Navigate to /dashboard/settlements to view generated settlements');
    console.log('  3. Test settlement approval and PDF generation');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
