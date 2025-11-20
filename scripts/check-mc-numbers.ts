import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const mcNumbers = await prisma.mcNumber.findMany({
      select: {
        id: true,
        number: true,
        companyName: true,
        type: true,
        isDefault: true,
        company: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { companyName: 'asc' },
      where: { deletedAt: null },
    });

    console.log('\n📋 MC Numbers in database:');
    console.log('='.repeat(70));
    if (mcNumbers.length === 0) {
      console.log('No MC numbers found.');
    } else {
      mcNumbers.forEach((mc, i) => {
        console.log(`${i + 1}. ${mc.companyName || 'N/A'}`);
        console.log(`   MC Number: ${mc.number}`);
        console.log(`   Type: ${mc.type}`);
        console.log(`   Default: ${mc.isDefault ? 'Yes' : 'No'}`);
        console.log(`   Company: ${mc.company.name} (ID: ${mc.company.id})`);
        console.log('');
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

