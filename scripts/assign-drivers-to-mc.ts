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
    console.log('🔄 Assigning drivers to MC number...\n');

    // List all MC numbers
    const mcNumbers = await prisma.mcNumber.findMany({
      where: { deletedAt: null },
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
    });

    if (mcNumbers.length === 0) {
      console.log('❌ No MC numbers found in the database.');
      return;
    }

    console.log('Available MC numbers:');
    mcNumbers.forEach((mc, index) => {
      console.log(`${index + 1}. ${mc.companyName} (MC: ${mc.number}) - Company: ${mc.company.name}`);
      if (mc.isDefault) {
        console.log('   ⭐ Default MC number');
      }
    });

    // Get target MC number
    const targetInput = await question('\nEnter MC number to assign drivers to (Truckzilla Inc or MC number): ');
    let targetMc: typeof mcNumbers[0] | undefined;

    // Try to parse as number first
    const targetIndex = parseInt(targetInput);
    if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= mcNumbers.length) {
      targetMc = mcNumbers[targetIndex - 1];
    } else {
      // Try to find by name or MC number
      const targetName = targetInput.trim().toLowerCase();
      targetMc = mcNumbers.find(
        (mc) =>
          mc.companyName.toLowerCase().includes(targetName) ||
          targetName.includes(mc.companyName.toLowerCase()) ||
          mc.number.toString().includes(targetInput.trim())
      );
    }

    if (!targetMc) {
      console.log('❌ MC number not found.');
      return;
    }

    console.log(`\n📍 Target MC number: ${targetMc.companyName} (MC: ${targetMc.number})`);

    // Get all drivers - we'll filter by checking if they need MC assignment
    // Note: mcNumberId is required, so we get all drivers and check their MC assignment
    const allDrivers = await prisma.driver.findMany({
      where: {
        companyId: targetMc.company.id,
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
        mcNumber: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    // Filter drivers that don't have the target MC number assigned
    const driversWithoutMc = allDrivers.filter((driver: any) => driver.mcNumberId !== targetMc.id);

    if (driversWithoutMc.length === 0) {
      console.log('❌ No drivers found without MC number assignment in this company.');
      return;
    }

    console.log(`\n📊 Found ${driversWithoutMc.length} driver(s) without MC number assignment:`);
    driversWithoutMc.forEach((driver: any, index: number) => {
      console.log(`${index + 1}. ${driver.user?.firstName || ''} ${driver.user?.lastName || ''} (${driver.driverNumber}) - Current MC: ${driver.mcNumber?.number || 'None'}`);
    });

    // Confirm
    console.log(`\n⚠️  WARNING: This will assign all ${driversWithoutMc.length} driver(s) to "${targetMc.companyName}" (MC: ${targetMc.number}).`);
    const confirm = await question('Are you sure? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      return;
    }

    // Assign MC number to drivers
    console.log('\n🔄 Assigning MC numbers...');
    let assigned = 0;
    let errors = 0;

    for (const driver of driversWithoutMc) {
      try {
        await prisma.driver.update({
          where: { id: driver.id },
          data: { mcNumberId: targetMc.id },
        });

        assigned++;
        console.log(`✓ Assigned ${(driver as any).user?.firstName || ''} ${(driver as any).user?.lastName || ''} (${driver.driverNumber}) to MC ${targetMc.number}`);
      } catch (error: any) {
        errors++;
        console.error(`✗ Error assigning ${driver.driverNumber}: ${error.message}`);
      }
    }

    console.log(`\n✅ Assignment complete!`);
    console.log(`   Assigned: ${assigned}`);
    console.log(`   Errors: ${errors}`);

    // Verify
    const driversWithMc = await prisma.driver.count({
      where: {
        companyId: targetMc.company.id,
        mcNumberId: targetMc.id,
        deletedAt: null,
      },
    });

    console.log(`\n📊 Total drivers with MC ${targetMc.number} in "${targetMc.company.name}": ${driversWithMc}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();


