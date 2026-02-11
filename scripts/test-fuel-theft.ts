import { FuelTheftManager } from './lib/managers/FuelTheftManager';
import { prisma } from './lib/prisma';

async function testFuelTheft() {
    console.log('--- Testing Fuel Theft Detection ---');

    // 1. Find a real truck and driver for context
    const truck = await prisma.truck.findFirst({
        where: { samsaraId: { not: null } },
        include: { company: true }
    });

    if (!truck) {
        console.error('No truck with Samsara ID found in DB. Please ensure a truck is linked to Samsara.');
        return;
    }

    // 2. Create a mock fuel entry that is FAR from a typical location (e.g., North Pole)
    // In a real test, we'd use slightly offset coords, but for proof of anomaly:
    const mockEntry = await prisma.fuelEntry.create({
        data: {
            fuelEntryNumber: `TEST-THEFT-${Date.now()}`,
            truckId: truck.id,
            companyId: truck.companyId,
            date: new Date(),
            gallons: 50,
            costPerGallon: 4.5,
            totalCost: 225,
            odometer: 100000,
            location: 'MOCK THEFT LOCATION',
            latitude: 80.0, // North Pole area
            longitude: 0.0,
            vendor: 'Suspicious Vendor'
        }
    });

    console.log(`Created mock fuel entry: ${mockEntry.fuelEntryNumber}`);

    // 3. Run the audit
    const manager = new FuelTheftManager();
    await manager.auditRecentTransactions(truck.id, truck.companyId);

    console.log('Audit complete. Check AI Anomalies table and Telegram for alerts.');
}

testFuelTheft().catch(console.error);
