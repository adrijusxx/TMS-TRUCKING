
import { PrismaClient } from '@prisma/client';
import { LoadImporter } from '../lib/managers/import/LoadImporter';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Load Importer Test...');

    // 1. Setup Context
    const company = await prisma.company.findFirst({
        include: { mcNumbers: true }
    });

    if (!company) {
        console.error('No company found. Run this against a DB with at least one company.');
        process.exit(1);
    }

    // Get MC Number
    const mcNumber = company.mcNumbers[0];
    const mcNumberId = mcNumber?.id;
    const mcNumberVal = mcNumber?.number || 'MC-TEST';

    // Get User
    const user = await prisma.user.findFirst({
        where: { companyId: company.id }
    });

    if (!user) {
        console.error('No user found.');
        process.exit(1);
    }

    console.log(`Using Company: ${company.name} (${company.id})`);
    console.log(`Using MC: ${mcNumberVal}`);

    // 2. Prepare Test Data
    const uniqueSuffix = Date.now();
    const driverName = `TestDrvr_${uniqueSuffix}`;
    const truckNum = `TRK_${uniqueSuffix}`;
    // Customer with spaces to test parsing if applicable, but LoadImporter does basic lookup
    const custName = `Cust_${uniqueSuffix}`;

    const row1 = {
        'Load ID': `LOAD-${uniqueSuffix}-1`,
        'Customer Name': custName,
        'Driver Name': driverName,
        'Truck ID': truckNum,
        'Trailer ID': `TRL_${uniqueSuffix}`,
        'Load Status': 'DELIVERED',
        'Revenue': '1500',
        'Miles': '500',
        'Pickup Date': '2023-01-01',
        'Delivery Date': '2023-01-02'
    };

    const row2 = {
        'Load ID': `LOAD-${uniqueSuffix}-2`,
        'Customer Name': custName, // Same
        'Driver Name': driverName, // Same
        'Truck ID': truckNum, // Same
        'Trailer ID': `TRL_${uniqueSuffix}`, // Same
        'Load Status': 'PENDING',
        'Revenue': '2000',
        'Miles': '600',
        'Pickup Date': '2023-01-03',
        'Delivery Date': '2023-01-04'
    };

    const data = [row1, row2];

    console.log(`Testing with Unique Entities: ${driverName}, ${truckNum}, ${custName}`);

    // 3. Run Import
    // We mock column mapping or let it infer (LoadImporter uses hardcoded lists in getValue)
    // We are creating a real instance.
    // Note: LoadImporter extends BaseImporter which has 'aiService'.
    // If we don't mock aiService, it might try to call OpenAI.
    // However, BaseImporter initializes `this.aiService = new AIService()`.
    // If AIService needs env vars and they are present (which they should be in dev env), it might work.
    // LoadImporter doesn't seem to call AI for simple ID resolution, only for fuzzy matching maybe?
    // Let's hope it doesn't block.

    const importer = new LoadImporter(prisma, company.id, user.id);

    try {
        const result = await importer.import(data, {
            previewOnly: false,
            currentMcNumber: mcNumberVal,
            mcNumberId: mcNumberId,
            updateExisting: false,
            columnMapping: {} // Empty mapping reliance on default aliases
        });
        console.log('Import Finished.');
        console.log('Result Summary:', result.summary);
        if (result.errors.length > 0) {
            console.error('Errors:', result.errors);
        }
    } catch (err) {
        console.error('Import Failed:', err);
    }

    // 4. Verify Database
    // Driver Check
    // Note: driverNumber is `driverName` if it has digits and no spaces (TestDrvr_...)
    const drivers = await prisma.driver.findMany({
        where: { companyId: company.id, driverNumber: { contains: driverName } }
    });

    const trucks = await prisma.truck.findMany({
        where: { companyId: company.id, truckNumber: { contains: truckNum } }
    });

    const customers = await prisma.customer.findMany({
        where: { companyId: company.id, name: { contains: custName } }
    });

    const loads = await prisma.load.findMany({
        where: {
            companyId: company.id,
            loadNumber: { in: [`LOAD-${uniqueSuffix}-1`, `LOAD-${uniqueSuffix}-2`] }
        }
    });

    console.log('\n--- Verification ---');
    console.log(`Drivers Found (Expected 1): ${drivers.length}`);
    drivers.forEach(d => console.log(` - Driver: ${d.driverNumber} (ID: ${d.id})`));

    console.log(`Trucks Found (Expected 1): ${trucks.length}`);
    trucks.forEach(t => console.log(` - Truck: ${t.truckNumber} (ID: ${t.id})`));

    console.log(`Customers Found (Expected 1): ${customers.length}`);
    customers.forEach(c => console.log(` - Customer: ${c.name} (ID: ${c.id})`));

    console.log(`Loads Created (Expected 2): ${loads.length}`);

    if (drivers.length === 1 && trucks.length === 1 && customers.length === 1 && loads.length === 2) {
        console.log('SUCCESS: Deduplication Logic Works.');

        // Verify linkage
        const load1 = loads.find(l => l.loadNumber === `LOAD-${uniqueSuffix}-1`);
        if (load1?.driverId === drivers[0].id) {
            console.log(' - Load 1 Linked to Correct Driver');
        } else {
            console.error(' - Load 1 Driver Link Mismatch');
        }
    } else {
        console.error('FAILURE: Duplicate counts or missing data detected.');
    }

    // cleanup
    // await prisma.load.deleteMany({ where: { loadNumber: { in: [`LOAD-${uniqueSuffix}-1`, `LOAD-${uniqueSuffix}-2`] } } });
    // console.log('Cleanup done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
