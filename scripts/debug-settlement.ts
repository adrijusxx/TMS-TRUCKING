
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const settlementId = 'cmk37kpdn009euoj801i292xe';
    const targetCompanyId = 'cmjlj0l8u0000uosscqdvk1fz';

    console.log(`Checking Settlement: ${settlementId}`);

    const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
        include: {
            driver: {
                select: {
                    id: true,
                    companyId: true,
                    user: {
                        select: {
                            id: true,
                            companyId: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        }
    });

    if (!settlement) {
        console.log('❌ Settlement NOT FOUND in database via findUnique.');
    } else {
        console.log('✅ Settlement FOUND.');
        console.log('Settlement Data:', {
            id: settlement.id,
            driverId: settlement.driverId,
            status: settlement.status
        });

        if (settlement.driver) {
            console.log('Driver Data:', {
                id: settlement.driver.id,
                companyId: settlement.driver.companyId,
                firstName: settlement.driver.user?.firstName
            });

            const compMatch = settlement.driver.companyId === targetCompanyId;
            console.log(`Driver CompanyId matches session (${targetCompanyId})? ${compMatch}`);

            if (!compMatch) {
                console.log(`⚠ MISMATCH: Driver CompanyId (${settlement.driver.companyId}) != Session (${targetCompanyId})`);
            }
        } else {
            console.log('❌ Driver is NULL on settlement.');
        }
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
