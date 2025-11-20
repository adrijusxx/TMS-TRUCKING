import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  try {
    console.log('🔄 Moving drivers between companies...\n');

    // List all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        dotNumber: true,
      },
      orderBy: { name: 'asc' },
    });

    if (companies.length === 0) {
      console.log('❌ No companies found in the database.');
      return;
    }

    console.log('Available companies:');
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
    });

    // Get source company (can be specified by name or number)
    const sourceInput = await question('\nEnter source company number or name (FOUR WAYS LOGISTICS II I): ');
    let sourceCompany: typeof companies[0] | undefined;
    
    // Try to parse as number first
    const sourceIndex = parseInt(sourceInput);
    if (!isNaN(sourceIndex) && sourceIndex >= 1 && sourceIndex <= companies.length) {
      sourceCompany = companies[sourceIndex - 1];
    } else {
      // Try to find by name (case-insensitive partial match)
      const sourceName = sourceInput.trim().toLowerCase();
      sourceCompany = companies.find(
        (c) => c.name.toLowerCase().includes(sourceName) || sourceName.includes(c.name.toLowerCase())
      );
    }

    if (!sourceCompany) {
      console.log('❌ Source company not found.');
      return;
    }

    // Get target company (can be specified by name or number)
    const targetInput = await question('Enter target company number or name (Truckzilla Inc): ');
    let targetCompany: typeof companies[0] | undefined;
    
    // Try to parse as number first
    const targetIndex = parseInt(targetInput);
    if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= companies.length) {
      targetCompany = companies[targetIndex - 1];
    } else {
      // Try to find by name (case-insensitive partial match)
      const targetName = targetInput.trim().toLowerCase();
      targetCompany = companies.find(
        (c) => c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase())
      );
    }

    if (!targetCompany) {
      console.log('❌ Target company not found.');
      return;
    }

    if (sourceCompany.id === targetCompany.id) {
      console.log('❌ Source and target companies cannot be the same.');
      return;
    }

    // Confirm
    console.log(`\n⚠️  WARNING: This will move ALL drivers from "${sourceCompany.name}" to "${targetCompany.name}".`);
    const confirm = await question('Are you sure? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      return;
    }

    // Count drivers in source company
    const driverCount = await prisma.driver.count({
      where: {
        companyId: sourceCompany.id,
        deletedAt: null,
      },
    });

    console.log(`\n📊 Found ${driverCount} driver(s) to move.`);

    if (driverCount === 0) {
      console.log('❌ No drivers found in source company.');
      return;
    }

    // Get all drivers from source company
    const drivers = await prisma.driver.findMany({
      where: {
        companyId: sourceCompany.id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('\n📋 Drivers to move:');
    drivers.forEach((driver, index) => {
      console.log(
        `${index + 1}. ${driver.user.firstName} ${driver.user.lastName} (${driver.driverNumber}) - ${driver.user.email}`
      );
    });

    // Move drivers
    console.log('\n🔄 Moving drivers...');
    let moved = 0;
    let errors = 0;

    for (const driver of drivers) {
      try {
        // Update driver companyId
        await prisma.driver.update({
          where: { id: driver.id },
          data: { companyId: targetCompany.id },
        });

        // Update user companyId
        await prisma.user.update({
          where: { id: driver.user.id },
          data: { companyId: targetCompany.id },
        });

        moved++;
        console.log(`✓ Moved ${driver.user.firstName} ${driver.user.lastName} (${driver.driverNumber})`);
      } catch (error: any) {
        errors++;
        console.error(`✗ Error moving ${driver.driverNumber}: ${error.message}`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Moved: ${moved}`);
    console.log(`   Errors: ${errors}`);

    // Verify
    const targetDriverCount = await prisma.driver.count({
      where: {
        companyId: targetCompany.id,
        deletedAt: null,
      },
    });

    console.log(`\n📊 Total drivers in "${targetCompany.name}": ${targetDriverCount}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();

