import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCompanies() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        mcNumbers: {
          where: { deletedAt: null },
          select: { id: true, number: true, companyName: true },
        },
      },
    });

    console.log(`Found ${companies.length} companies:\n`);

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   DOT: ${company.dotNumber}`);
      console.log(`   MC: ${company.mcNumber || 'Not set'}`);
      console.log(`   MC Numbers: ${company.mcNumbers.length}`);
      if (company.mcNumbers.length > 0) {
        company.mcNumbers.forEach((mc) => {
          console.log(`     - ${mc.companyName || company.name} (MC ${mc.number}) - ${mc.id}`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error listing companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCompanies();

