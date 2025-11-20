import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        dotNumber: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log('\n📋 Companies in database:');
    console.log('='.repeat(60));
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   DOT: ${company.dotNumber || 'N/A'}`);
      console.log('');
    });

    // Also check drivers
    for (const company of companies) {
      const driverCount = await prisma.driver.count({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      });
      if (driverCount > 0) {
        console.log(`   📊 Drivers: ${driverCount}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

