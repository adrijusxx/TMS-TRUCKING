
import { PrismaClient } from '@prisma/client';
import { DriverImporter } from '../lib/managers/import/DriverImporter';
import { LoadImporter } from '../lib/managers/import/LoadImporter'; // Check imports

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Driver Importer Test...');

    const company = await prisma.company.findFirst({ include: { mcNumbers: true } });
    const user = await prisma.user.findFirst({ where: { companyId: company?.id } });
    if (!company || !user) throw new Error('Context missing');

    const uniqueSuffix = Date.now();
    const nameToSplit = `SplitDriver ${uniqueSuffix}`;
    const email = `split.${uniqueSuffix}@test.local`;

    // Data with single "Name" column
    const data = [{
        'Name': nameToSplit,
        'Phone': `555-${uniqueSuffix.toString().slice(-4)}`,
        'Email': email
    }];

    console.log(`Testing Driver Import with Name: "${nameToSplit}"`);

    const importer = new DriverImporter(prisma, company.id, user.id);
    const result = await importer.import(data, {
        previewOnly: false,
        updateExisting: false,
        currentMcNumber: company.mcNumbers[0]?.number,
        columnMapping: {}
    });

    console.log('Import Result:', result.summary);
    if (result.errors.length > 0) console.error('Errors:', result.errors);

    // Verify
    // DriverImporter creates a User if email provided, or links to existing.
    // It mocks email if missing, but we provided it.

    const driver = await prisma.driver.findFirst({
        where: {
            companyId: company.id,
            user: { email: email }
        },
        include: { user: true }
    });

    if (driver && driver.user) {
        console.log(`Driver Created: [${driver.user.firstName}] [${driver.user.lastName}]`);
        if (driver.user.firstName === 'SplitDriver' && driver.user.lastName === uniqueSuffix.toString()) {
            console.log('SUCCESS: Name Splitting match!');
        } else {
            console.error('FAILURE: Name Splitting mismatch. Expected "SplitDriver" and timestamp.');
        }
    } else {
        console.error('FAILURE: Driver not found by email.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
