import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        driverNumber: true,
        mcNumber: true,
        company: {
          select: {
            name: true,
            id: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      take: 10,
    });

    console.log('\n📋 Sample drivers (first 10):');
    console.log('='.repeat(70));
    drivers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.user.firstName} ${d.user.lastName}`);
      console.log(`   Driver Number: ${d.driverNumber}`);
      console.log(`   Email: ${d.user.email}`);
      console.log(`   MC Number: ${d.mcNumber || 'None'}`);
      console.log(`   Company: ${d.company.name} (ID: ${d.company.id})`);
      console.log('');
    });

    const total = await prisma.driver.count({
      where: { deletedAt: null },
    });
    console.log(`\n📊 Total drivers: ${total}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();


