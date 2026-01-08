
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetDriverId = 'cmjvypcz60225uow87gls76n5';

    const driver = await prisma.driver.findUnique({
        where: { id: targetDriverId },
        include: {
            loads: {
                take: 20,
                orderBy: { createdAt: 'desc' } // or deliveryDate?
            }
        }
    });

    if (driver) {
        console.log(`Checking Driver: ${driver.id} (Rate: ${driver.payRate})`);
        driver.loads.forEach(l => {
            console.log(`Load #${l.loadNumber} (ID:${l.id}): Revenue=$${l.revenue}, DriverPay=$${l.driverPay}, Miles=${l.totalMiles}`);
            const expected = (l.totalMiles || 0) * (driver.payRate || 0);
            console.log(`   -> Expected (CPM $${driver.payRate}): $${expected.toFixed(2)}`);
            if (Math.abs((l.driverPay || 0) - expected) > 1) {
                console.log('   ⚠ MISMATCH DETECTED (Using Stored?)');
            }
        });
    } else {
        console.log("Driver not found (by ID).");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
