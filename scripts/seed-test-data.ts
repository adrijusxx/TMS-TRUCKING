/**
 * Comprehensive Test Data Seed for TMS
 * 
 * Creates fresh test data under Adriano's company with a new MC:
 * - 1 New MC Number (TEST-MC)
 * - 10 Drivers with varied pay types and deduction rules
 * - 10 Trucks
 * - 5 Trailers
 * - 30 Loads at various statuses (Pending → Delivered → Invoiced → Paid)
 * - 3 Customers (Brokers)
 * - Invoices and Settlements for testing full workflow
 * 
 * Usage: npx tsx scripts/seed-test-data.ts
 */

import { PrismaClient, LoadStatus, SettlementStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================
const COMPANY_NAME_SEARCH = 'Adriano'; // Will find company containing this name
const NEW_MC_NUMBER = 'MC-TEST-2026';
const NEW_MC_DOT = 'DOT-TEST-2026';
const PASSWORD_HASH = bcrypt.hashSync('Test123!', 10);

// ============================================
// HELPER FUNCTIONS
// ============================================
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateLoadNumber(): string {
    return `LD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
}

// US Cities for realistic routes
const CITIES = [
    { city: 'Los Angeles', state: 'CA' },
    { city: 'Dallas', state: 'TX' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Atlanta', state: 'GA' },
    { city: 'Phoenix', state: 'AZ' },
    { city: 'Houston', state: 'TX' },
    { city: 'Denver', state: 'CO' },
    { city: 'Seattle', state: 'WA' },
    { city: 'Miami', state: 'FL' },
    { city: 'New York', state: 'NY' },
    { city: 'Nashville', state: 'TN' },
    { city: 'Kansas City', state: 'MO' },
    { city: 'Salt Lake City', state: 'UT' },
    { city: 'Portland', state: 'OR' },
    { city: 'Indianapolis', state: 'IN' },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seedTestData() {
    console.log('🌱 Starting TMS Test Data Seed...\n');

    // ============================================
    // STEP 1: Find Adriano's Company
    // ============================================
    console.log('📦 Step 1: Finding company...');

    const company = await prisma.company.findFirst({
        where: {
            name: { contains: COMPANY_NAME_SEARCH, mode: 'insensitive' },
        },
    });

    if (!company) {
        throw new Error(`Company containing "${COMPANY_NAME_SEARCH}" not found!`);
    }

    console.log(`   ✅ Found company: ${company.name} (${company.id})\n`);

    // ============================================
    // STEP 2: Create New MC Number
    // ============================================
    console.log('🏷️ Step 2: Creating new MC Number...');

    // Check if MC already exists
    let mcNumber = await prisma.mcNumber.findFirst({
        where: { number: NEW_MC_NUMBER, companyId: company.id },
    });

    if (!mcNumber) {
        mcNumber = await prisma.mcNumber.create({
            data: {
                companyId: company.id,
                number: NEW_MC_NUMBER,
                usdot: NEW_MC_DOT,
                companyName: 'Test Fleet Operations',
                owner: 'Test Owner',
                address: '123 Test Street',
                city: 'Dallas',
                state: 'TX',
                zip: '75001',
                companyPhone: '555-TEST-001',
                email: 'test@testfleet.com',
                isDefault: false,
            },
        });
        console.log(`   ✅ Created MC: ${mcNumber.number}\n`);
    } else {
        console.log(`   ⚠️ MC ${NEW_MC_NUMBER} already exists, using it\n`);
    }

    // ============================================
    // STEP 3: Create Customers (Brokers)
    // ============================================
    console.log('👥 Step 3: Creating customers (brokers)...');

    const customerData = [
        { name: 'TQL Logistics', contact: 'John Smith', email: 'dispatch@tql.test', phone: '555-100-0001' },
        { name: 'CH Robinson', contact: 'Sarah Johnson', email: 'loads@chr.test', phone: '555-100-0002' },
        { name: 'Coyote Logistics', contact: 'Mike Davis', email: 'freight@coyote.test', phone: '555-100-0003' },
    ];

    const customers: any[] = [];
    for (const cust of customerData) {
        let customer = await prisma.customer.findFirst({
            where: { name: cust.name, companyId: company.id },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    companyId: company.id,
                    customerNumber: `CUST-TEST-${String(customers.length + 1).padStart(3, '0')}`,
                    name: cust.name,
                    email: cust.email,
                    phone: cust.phone,
                    address: `${Math.floor(Math.random() * 9999)} Broker Ave`,
                    city: 'Chicago',
                    state: 'IL',
                    zip: '60601',
                    paymentTerms: 30,
                    isActive: true,
                },
            });
        }
        customers.push(customer);
        console.log(`   ✅ Customer: ${customer.name}`);
    }
    console.log('');

    // ============================================
    // STEP 4: Create Trucks
    // ============================================
    console.log('🚛 Step 4: Creating trucks...');

    const trucks: any[] = [];
    for (let i = 1; i <= 10; i++) {
        const truckNumber = `TEST-${String(i).padStart(3, '0')}`;

        let truck = await prisma.truck.findFirst({
            where: { truckNumber, companyId: company.id },
        });

        if (!truck) {
            truck = await prisma.truck.create({
                data: {
                    companyId: company.id,
                    mcNumberId: mcNumber.id,
                    truckNumber,
                    vin: `1HGCM${Date.now().toString().slice(-11)}${i}`,
                    make: randomElement(['Freightliner', 'Peterbilt', 'Kenworth', 'Volvo', 'International']),
                    model: randomElement(['Cascadia', '579', 'T680', 'VNL', 'LT']),
                    year: randomElement([2020, 2021, 2022, 2023, 2024]),
                    licensePlate: `TEST${i}`,
                    state: 'TX',
                    capacity: 48000,
                    registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    inspectionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    status: 'AVAILABLE',
                    equipmentType: 'DRY_VAN',
                    odometerReading: Math.floor(Math.random() * 300000) + 50000,
                },
            });
        }
        trucks.push(truck);
        console.log(`   ✅ Truck: ${truck.truckNumber} (${truck.make} ${truck.model})`);
    }
    console.log('');

    // ============================================
    // STEP 5: Create Trailers
    // ============================================
    console.log('📦 Step 5: Creating trailers...');

    const trailers: any[] = [];
    for (let i = 1; i <= 5; i++) {
        const trailerNumber = `TRL-${String(i).padStart(3, '0')}`;

        let trailer = await prisma.trailer.findFirst({
            where: { trailerNumber, companyId: company.id },
        });

        if (!trailer) {
            trailer = await prisma.trailer.create({
                data: {
                    companyId: company.id,
                    mcNumberId: mcNumber.id,
                    trailerNumber,
                    vin: `2HGCM${Date.now().toString().slice(-11)}${i}`,
                    type: randomElement(['DRY_VAN', 'REEFER', 'FLATBED']) as any,
                    make: randomElement(['Great Dane', 'Wabash', 'Hyundai', 'Utility']),
                    model: randomElement(['53ft Dry Van', '53ft Reefer', '48ft Flatbed']),
                    year: randomElement([2019, 2020, 2021, 2022]),
                    licensePlate: `TRL${i}`,
                    state: 'TX',
                    registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    status: 'AVAILABLE',
                },
            });
        }
        trailers.push(trailer);
        console.log(`   ✅ Trailer: ${trailer.trailerNumber}`);
    }
    console.log('');

    // ============================================
    // STEP 6: Create Drivers (10 with varied pay types)
    // ============================================
    console.log('👨‍✈️ Step 6: Creating 10 drivers with varied pay types...');

    const driverConfigs = [
        { firstName: 'John', lastName: 'TestDriver', payType: 'PER_MILE', payRate: 0.60, driverType: 'COMPANY_DRIVER' },
        { firstName: 'Jane', lastName: 'PercentPay', payType: 'PERCENTAGE', payRate: 28, driverType: 'OWNER_OPERATOR' },
        { firstName: 'Mike', lastName: 'PerLoad', payType: 'PER_LOAD', payRate: 500, driverType: 'COMPANY_DRIVER' },
        { firstName: 'Sarah', lastName: 'Hourly', payType: 'HOURLY', payRate: 25, driverType: 'COMPANY_DRIVER' },
        { firstName: 'Tom', lastName: 'Lease', payType: 'PER_LOAD', payRate: 600, driverType: 'LEASE' },
        { firstName: 'Lisa', lastName: 'HighMiler', payType: 'PER_MILE', payRate: 0.65, driverType: 'OWNER_OPERATOR' },
        { firstName: 'Bob', lastName: 'LowPercent', payType: 'PERCENTAGE', payRate: 25, driverType: 'COMPANY_DRIVER' },
        { firstName: 'Amy', lastName: 'NewHire', payType: 'PER_MILE', payRate: 0.55, driverType: 'COMPANY_DRIVER' },
        { firstName: 'Dave', lastName: 'Veteran', payType: 'PERCENTAGE', payRate: 30, driverType: 'OWNER_OPERATOR' },
        { firstName: 'Emma', lastName: 'Trainee', payType: 'HOURLY', payRate: 20, driverType: 'COMPANY_DRIVER' },
    ];

    const drivers: any[] = [];
    for (let i = 0; i < driverConfigs.length; i++) {
        const config = driverConfigs[i];
        const driverNumber = `DRV-TEST-${String(i + 1).padStart(3, '0')}`;

        // Create user first
        const email = `${config.firstName.toLowerCase()}.${config.lastName.toLowerCase()}@testfleet.com`;

        let user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    companyId: company.id,
                    mcNumberId: mcNumber.id,
                    email,
                    password: PASSWORD_HASH,
                    firstName: config.firstName,
                    lastName: config.lastName,
                    role: 'DRIVER',
                    isActive: true,
                },
            });
        }

        // Create driver
        let driver = await prisma.driver.findFirst({
            where: { driverNumber, companyId: company.id },
        });

        if (!driver) {
            driver = await prisma.driver.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    mcNumberId: mcNumber.id,
                    driverNumber,
                    driverType: config.driverType as any,
                    payType: config.payType as any,
                    payRate: config.payRate,
                    licenseNumber: `CDL-${config.firstName.toUpperCase()}-${Date.now().toString().slice(-6)}`,
                    licenseState: randomElement(['TX', 'CA', 'IL', 'GA', 'FL']),
                    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                    medicalCardExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    hireDate: randomDate(new Date('2022-01-01'), new Date('2024-06-01')),
                    status: 'AVAILABLE',
                },
            });

            // Create deduction rules for this driver
            const deductionRules = [
                { name: `Driver ${driverNumber} - Insurance`, type: 'INSURANCE', amount: 50, isAddition: false },
                { name: `Driver ${driverNumber} - Escrow`, type: 'ESCROW', amount: 100, goalAmount: 2500, isAddition: false },
            ];

            // Add reimbursement for owner operators
            if (config.driverType === 'OWNER_OPERATOR') {
                deductionRules.push({
                    name: `Driver ${driverNumber} - Fuel Reimbursement`,
                    type: 'REIMBURSEMENT',
                    amount: 75,
                    isAddition: true,
                } as any);
            }

            for (const rule of deductionRules) {
                await prisma.deductionRule.create({
                    data: {
                        companyId: company.id,
                        driverId: driver.id,
                        name: rule.name,
                        deductionType: rule.type as any,
                        driverType: config.driverType as any,
                        calculationType: 'FIXED',
                        amount: rule.amount,
                        goalAmount: (rule as any).goalAmount,
                        frequency: 'WEEKLY',
                        isActive: true,
                        isAddition: rule.isAddition || false,
                    },
                });
            }
        }

        drivers.push(driver);
        console.log(`   ✅ Driver: ${config.firstName} ${config.lastName} | ${config.payType} @ $${config.payRate} | ${config.driverType}`);
    }
    console.log('');

    // ============================================
    // STEP 7: Create Loads at Various Statuses
    // ============================================
    console.log('📋 Step 7: Creating 30 loads at various statuses...');

    const loadStatuses: LoadStatus[] = [
        'PENDING', 'PENDING', 'PENDING',              // 3 pending
        'ASSIGNED', 'ASSIGNED',                        // 2 assigned
        'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED',     // 3 pickup stages
        'EN_ROUTE_DELIVERY', 'AT_DELIVERY',            // 2 delivery stages
        'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', // 5 delivered (ready for settlement)
        'INVOICED', 'INVOICED', 'INVOICED', 'INVOICED',  // 4 invoiced
        'PAID', 'PAID', 'PAID',                        // 3 paid
        'READY_TO_BILL', 'READY_TO_BILL',              // 2 ready to bill
        'BILLING_HOLD',                                 // 1 billing hold
    ];

    const loads: any[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 30; i++) {
        const status = loadStatuses[i] || 'PENDING';
        const driver = drivers[i % drivers.length];
        const customer = customers[i % customers.length];
        const pickup = CITIES[i % CITIES.length];
        const delivery = CITIES[(i + 5) % CITIES.length];

        const loadNumber = `TEST-${String(i + 1).padStart(4, '0')}`;
        const miles = Math.floor(Math.random() * 1500) + 300;
        const revenue = miles * randomElement([2.50, 2.75, 3.00, 3.25, 3.50]);

        // Calculate driver pay based on their pay type
        let driverPay = 0;
        if (driver.payType === 'PER_MILE') {
            driverPay = miles * driver.payRate;
        } else if (driver.payType === 'PERCENTAGE') {
            driverPay = revenue * (driver.payRate / 100);
        } else if (driver.payType === 'PER_LOAD') {
            driverPay = driver.payRate;
        } else if (driver.payType === 'HOURLY') {
            driverPay = (miles / 50) * driver.payRate; // Estimate 50 mph
        } else if (driver.payType === 'WEEKLY') {
            driverPay = driver.payRate / 5; // Divide weekly by 5 loads
        }

        let load = await prisma.load.findFirst({
            where: { loadNumber, companyId: company.id },
        });

        if (!load) {
            const pickupDate = randomDate(twoWeeksAgo, oneWeekAgo);
            const deliveryDate = new Date(pickupDate.getTime() + (miles / 500) * 24 * 60 * 60 * 1000);

            load = await prisma.load.create({
                data: {
                    companyId: company.id,
                    mcNumberId: mcNumber.id,
                    customerId: customer.id,
                    driverId: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL'].includes(status) ? driver.id : null,
                    truckId: ['EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID'].includes(status) ? trucks[i % trucks.length]?.id : null,
                    trailerId: ['EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID'].includes(status) ? trailers[i % trailers.length]?.id : null,
                    loadNumber,
                    status,
                    pickupCity: pickup.city,
                    pickupState: pickup.state,
                    pickupDate,
                    deliveryCity: delivery.city,
                    deliveryState: delivery.state,
                    deliveryDate,
                    deliveredAt: ['DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL'].includes(status) ? deliveryDate : null,
                    revenue: Math.round(revenue * 100) / 100,
                    driverPay: Math.round(driverPay * 100) / 100,
                    totalMiles: miles,
                    loadedMiles: Math.round(miles * 0.85),
                    emptyMiles: Math.round(miles * 0.15),
                    weight: Math.floor(Math.random() * 20000) + 25000,
                    commodity: randomElement(['General Freight', 'Electronics', 'Food Products', 'Auto Parts', 'Building Materials']),
                    equipmentType: randomElement(['DRY_VAN', 'REEFER', 'FLATBED']) as any,
                    readyForSettlement: ['DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL'].includes(status),
                },
            });
        }
        loads.push(load);
        console.log(`   ✅ Load: ${load.loadNumber} | ${status} | ${pickup.city} → ${delivery.city} | $${Math.round(revenue)}`);
    }
    console.log('');

    // ============================================
    // STEP 8: Create Invoices for Invoiced/Paid Loads
    // ============================================
    console.log('💰 Step 8: Creating invoices...');

    const invoicedLoads = loads.filter(l => ['INVOICED', 'PAID'].includes(l.status));

    for (let i = 0; i < invoicedLoads.length; i++) {
        const load = invoicedLoads[i];
        const invoiceNumber = `INV-TEST-${String(i + 1).padStart(4, '0')}`;

        let invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber, companyId: company.id },
        });

        if (!invoice) {
            const customer = customers.find(c => c.id === load.customerId);
            invoice = await prisma.invoice.create({
                data: {
                    companyId: company.id,
                    mcNumberId: mcNumber.id,
                    customerId: load.customerId,
                    invoiceNumber,
                    loadIds: [load.id],
                    subtotal: load.revenue,
                    total: load.revenue,
                    balance: load.status === 'PAID' ? 0 : load.revenue,
                    invoiceDate: new Date(),
                    status: load.status === 'PAID' ? 'PAID' : 'SENT',
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    paidDate: load.status === 'PAID' ? new Date() : null,
                    amountPaid: load.status === 'PAID' ? load.revenue : 0,
                },
            });
            console.log(`   ✅ Invoice: ${invoiceNumber} | ${invoice.status} | $${load.revenue}`);
        }
    }
    console.log('');

    // ============================================
    // STEP 9: Summary
    // ============================================
    console.log('========================================');
    console.log('📊 SEED COMPLETE - Summary:');
    console.log('========================================');
    console.log(`   Company: ${company.name}`);
    console.log(`   MC Number: ${mcNumber.number}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Trucks: ${trucks.length}`);
    console.log(`   Trailers: ${trailers.length}`);
    console.log(`   Drivers: ${drivers.length}`);
    console.log(`   Loads: ${loads.length}`);
    console.log(`   Invoices: ${invoicedLoads.length}`);
    console.log('');
    console.log('🧪 READY TO TEST:');
    console.log('   1. Settlement Generation - 5 DELIVERED loads ready');
    console.log('   2. Load Workflow - Loads at all statuses');
    console.log('   3. Invoicing/Factoring - Invoices created');
    console.log('   4. Multi-MC - New MC created under your company');
    console.log('========================================\n');
}

// ============================================
// RUN
// ============================================
seedTestData()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
