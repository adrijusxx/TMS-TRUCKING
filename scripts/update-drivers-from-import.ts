import { PrismaClient, Prisma } from '@prisma/client';
import * as readline from 'readline';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { join } from 'path';

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
    console.log('🔄 Updating drivers with driver tariff and truck assignments...\n');

    // Get file path
    const filePath = await question('Enter path to Excel/CSV file with driver data: ');
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found.');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length <= 1) {
      console.log('❌ No data rows found in file.');
      return;
    }

    const headers = (data[0] as any[]).map((h: any) => String(h || '').trim());
    const rows = data.slice(1) as any[];

    console.log(`\n📋 Found ${rows.length} rows to process.`);
    console.log(`Headers: ${headers.join(', ')}\n`);

    // Normalize headers
    const normalizedHeaders = headers.map((h) =>
      String(h || '').trim().toLowerCase().replace(/\s+/g, '_')
    );

    // Helper to get value from row
    const getValue = (row: any, headerNames: string[]): any => {
      for (const headerName of headerNames) {
        const index = normalizedHeaders.indexOf(
          headerName.toLowerCase().replace(/\s+/g, '_')
        );
        if (index >= 0 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
          return row[index];
        }
      }
      return null;
    };

    // Pre-fetch all trucks
    const allTrucks = await prisma.truck.findMany({
      where: { deletedAt: null },
      select: { id: true, truckNumber: true, companyId: true },
    });

    const truckMap = new Map<string, { id: string; companyId: string }>();
    allTrucks.forEach((t) => {
      const normalized = t.truckNumber.toLowerCase().trim();
      truckMap.set(normalized, { id: t.id, companyId: t.companyId });
      truckMap.set(t.truckNumber.trim(), { id: t.id, companyId: t.companyId });
      const noZeros = normalized.replace(/^0+/, '');
      if (noZeros !== normalized) {
        truckMap.set(noZeros, { id: t.id, companyId: t.companyId });
      }
    });

    console.log(`📊 Pre-fetched ${allTrucks.length} trucks for assignment\n`);

    // Process rows
    let updated = 0;
    let errors = 0;
    let notFound = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Try to find driver by email, driver number, or name
        const email = getValue(row, ['Email', 'email', 'Email Address', 'email_address']);
        const driverNumber = getValue(row, ['Driver Number', 'Driver Number', 'driver_number', 'Driver Number']);
        const firstName = getValue(row, ['First Name', 'First Name', 'first_name', 'FirstName']);
        const lastName = getValue(row, ['Last Name', 'Last Name', 'last_name', 'LastName']);

        if (!email && !driverNumber && (!firstName || !lastName)) {
          console.log(`⚠️  Row ${i + 1}: Skipping - no email, driver number, or name found`);
          continue;
        }

        // Find driver
        const driver = await prisma.driver.findFirst({
          where: {
            OR: [
              ...(email ? [{ user: { email: email.toLowerCase() } }] : []),
              ...(driverNumber ? [{ driverNumber }] : []),
              ...(firstName && lastName
                ? [
                    {
                      user: {
                        firstName: { contains: firstName, mode: Prisma.QueryMode.insensitive },
                        lastName: { contains: lastName, mode: Prisma.QueryMode.insensitive },
                      },
                    },
                  ]
                : []),
            ],
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        if (!driver) {
          notFound++;
          console.log(`❌ Row ${i + 1}: Driver not found (${email || driverNumber || `${firstName} ${lastName}`})`);
          continue;
        }

        // Get update data
        const driverTariff = getValue(row, ['Driver Tariff', 'Driver tariff', 'driver_tariff', 'DriverTariff', 'Tariff', 'tariff']);
        const payTo = getValue(row, ['Pay to', 'Pay To', 'pay_to', 'PayTo', 'Pay To Company', 'pay_to_company']);
        const truckNumber = getValue(row, ['Truck', 'truck', 'Truck Number', 'truck_number', 'Truck#', 'truck#', 'Unit number', 'Unit Number']);

        // Find truck
        let currentTruckId: string | null = null;
        if (truckNumber) {
          const normalized = String(truckNumber).trim().toLowerCase();
          const truck = truckMap.get(normalized) || 
                       truckMap.get(String(truckNumber).trim()) || 
                       truckMap.get(normalized.replace(/^0+/, ''));
          
          if (truck && truck.companyId === driver.companyId) {
            currentTruckId = truck.id;
          }
        }

        // Prepare update data
        const updateData: any = {};
        if (driverTariff) updateData.driverTariff = String(driverTariff).trim();
        if (payTo) updateData.payTo = String(payTo).trim();
        if (currentTruckId) updateData.currentTruckId = currentTruckId;

        if (Object.keys(updateData).length === 0) {
          console.log(`⚠️  Row ${i + 1}: No updates for ${driver.user.firstName} ${driver.user.lastName} (${driver.driverNumber})`);
          continue;
        }

        // Update driver
        await prisma.driver.update({
          where: { id: driver.id },
          data: updateData,
        });

        updated++;
        const updates: string[] = [];
        if (driverTariff) updates.push(`tariff: "${driverTariff}"`);
        if (payTo) updates.push(`payTo: "${payTo}"`);
        if (currentTruckId) updates.push(`truck: ${truckNumber}`);
        
        console.log(`✓ Row ${i + 1}: Updated ${driver.user.firstName} ${driver.user.lastName} (${driver.driverNumber}) - ${updates.join(', ')}`);
      } catch (error: any) {
        errors++;
        console.error(`✗ Row ${i + 1}: Error - ${error.message}`);
      }
    }

    console.log(`\n✅ Update complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound}`);
    console.log(`   Errors: ${errors}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();

