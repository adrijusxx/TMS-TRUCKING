import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script migrates all data from "Demo Trucking LLC" to "Four Ways Logistics"
 * WARNING: This will modify all data associated with Demo Trucking LLC!
 */
async function migrateDemoToFourWays() {
  console.log('🔄 Starting data migration from Demo Trucking LLC to Four Ways Logistics...');
  
  try {
    // Find the companies
    const demoCompany = await prisma.company.findFirst({
      where: {
        name: {
          contains: 'Demo Trucking',
          mode: 'insensitive',
        },
      },
    });

    if (!demoCompany) {
      console.log('❌ Demo Trucking LLC not found. Nothing to migrate.');
      return;
    }

    // Check if Four Ways Logistics Inc 2 exists as a company, or find the MC number
    let fourWaysCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { contains: 'Fourways Logistics Inc 2', mode: 'insensitive' } },
          { name: { contains: 'Four Ways Logistics Inc 2', mode: 'insensitive' } },
          { name: { contains: 'Fourways Logistics', mode: 'insensitive' } },
          { name: { contains: 'Four Ways', mode: 'insensitive' } },
        ],
      },
    });

    // If company doesn't exist, check if there's an MC number with that name
    // and create the company based on the MC number
    if (!fourWaysCompany) {
      const fourWaysMcNumber = await prisma.mcNumber.findFirst({
        where: {
          companyId: demoCompany.id,
          OR: [
            { companyName: { contains: 'Fourways Logistics Inc 2', mode: 'insensitive' } },
            { companyName: { contains: 'Four Ways Logistics Inc 2', mode: 'insensitive' } },
            { companyName: { contains: 'FOUR WAYS LOGISTICS INC 2', mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });

      if (fourWaysMcNumber) {
        console.log(`✓ Found MC number: ${fourWaysMcNumber.companyName} (MC ${fourWaysMcNumber.number})`);
        console.log('Creating company for Four Ways Logistics Inc 2...');
        
        // Create the company based on the MC number
        fourWaysCompany = await prisma.company.create({
          data: {
            name: fourWaysMcNumber.companyName || 'Four Ways Logistics Inc 2',
            dotNumber: fourWaysMcNumber.usdot || `DOT-${Date.now()}`,
            mcNumber: fourWaysMcNumber.number,
            address: demoCompany.address,
            city: demoCompany.city,
            state: demoCompany.state,
            zip: demoCompany.zip,
            phone: fourWaysMcNumber.companyPhone || demoCompany.phone,
            email: demoCompany.email?.replace('demo', 'fourways') || 'info@fourwayslogistics.com',
            isActive: true,
          },
        });
        console.log(`✓ Created company: ${fourWaysCompany.name} (ID: ${fourWaysCompany.id})`);
      } else {
        console.log('❌ Four Ways Logistics Inc 2 not found as company or MC number.');
        console.log('');
        console.log('Please create it first by running:');
        console.log('  npm run db:create-fourways');
        console.log('');
        console.log('Or manually create it through the application.');
        return;
      }
    }

    console.log(`✓ Found Demo Trucking LLC (ID: ${demoCompany.id})`);
    console.log(`✓ Found Four Ways Logistics (ID: ${fourWaysCompany.id})`);
    console.log('');

    // Get MC numbers for both companies
    const demoMcNumbers = await prisma.mcNumber.findMany({
      where: { companyId: demoCompany.id },
    });

    const fourWaysMcNumbers = await prisma.mcNumber.findMany({
      where: { companyId: fourWaysCompany.id },
    });

    console.log(`✓ Found ${demoMcNumbers.length} MC number(s) for Demo Trucking LLC`);
    console.log(`✓ Found ${fourWaysMcNumbers.length} MC number(s) for Four Ways Logistics`);
    console.log('');

    // Create a mapping for MC numbers if they exist
    // If Four Ways doesn't have MC numbers, we'll create them based on Demo's MC numbers
    const mcNumberMap = new Map<string, string>();
    
    if (demoMcNumbers.length > 0) {
      if (fourWaysMcNumbers.length === 0) {
        console.log('Creating MC numbers for Four Ways Logistics based on Demo Trucking LLC...');
        for (const demoMc of demoMcNumbers) {
          const newMc = await prisma.mcNumber.create({
            data: {
              companyId: fourWaysCompany.id,
              companyName: demoMc.companyName || fourWaysCompany.name,
              number: demoMc.number,
              type: demoMc.type,
              companyPhone: demoMc.companyPhone,
              owner: demoMc.owner,
              usdot: demoMc.usdot,
              notes: demoMc.notes,
              isDefault: demoMc.isDefault,
            },
          });
          mcNumberMap.set(demoMc.id, newMc.id);
          console.log(`  ✓ Created MC number ${newMc.number} (${newMc.companyName || newMc.number})`);
        }
      } else {
        // Map first MC to first MC, second to second, etc.
        for (let i = 0; i < Math.min(demoMcNumbers.length, fourWaysMcNumbers.length); i++) {
          mcNumberMap.set(demoMcNumbers[i].id, fourWaysMcNumbers[i].id);
          console.log(`  ✓ Mapping MC ${demoMcNumbers[i].number} -> ${fourWaysMcNumbers[i].number}`);
        }
        // If Demo has more MCs, create new ones for Four Ways
        if (demoMcNumbers.length > fourWaysMcNumbers.length) {
          console.log('Creating additional MC numbers for Four Ways Logistics...');
          for (let i = fourWaysMcNumbers.length; i < demoMcNumbers.length; i++) {
            const demoMc = demoMcNumbers[i];
            const newMc = await prisma.mcNumber.create({
              data: {
                companyId: fourWaysCompany.id,
                companyName: demoMc.companyName || fourWaysCompany.name,
                number: demoMc.number,
                type: demoMc.type,
                companyPhone: demoMc.companyPhone,
                owner: demoMc.owner,
                usdot: demoMc.usdot,
                notes: demoMc.notes,
                isDefault: false, // Don't set as default for additional MCs
              },
            });
            mcNumberMap.set(demoMc.id, newMc.id);
            console.log(`  ✓ Created MC number ${newMc.number} (${newMc.companyName || newMc.number})`);
          }
        }
      }
    }

    console.log('');
    console.log('Starting data migration...');

    // Helper function to get the mapped MC number ID
    const getMappedMcNumberId = (mcNumberId: string | null): string | null => {
      if (!mcNumberId) return null;
      return mcNumberMap.get(mcNumberId) || null;
    };

    // Helper function to get the mapped MC number value
    const getMappedMcNumber = async (mcNumberId: string | null): Promise<string | null> => {
      if (!mcNumberId) return null;
      const mappedId = mcNumberMap.get(mcNumberId);
      if (!mappedId) return null;
      const mc = await prisma.mcNumber.findUnique({ where: { id: mappedId }, select: { number: true } });
      return mc?.number || null;
    };

    // 1. Update Users
    const usersUpdated = await prisma.user.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${usersUpdated.count} users`);

    // Update user MC number assignments
    const usersWithMc = await prisma.user.findMany({
      where: {
        companyId: fourWaysCompany.id,
        mcNumberId: { in: Array.from(mcNumberMap.keys()) },
      },
    });
    for (const user of usersWithMc) {
      if (user.mcNumberId) {
        const mappedMcId = getMappedMcNumberId(user.mcNumberId);
        if (mappedMcId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { mcNumberId: mappedMcId },
          });
        }
      }
    }
    console.log(`✓ Updated ${usersWithMc.length} user MC number assignments`);

    // 2. Update UserCompany entries
    const userCompaniesUpdated = await prisma.userCompany.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${userCompaniesUpdated.count} user-company relationships`);

    // 3. Update Loads
    const loadsUpdated = await prisma.load.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${loadsUpdated.count} loads`);

    // Update load MC numbers (Load uses mcNumberId foreign key)
    const loads = await prisma.load.findMany({
      where: { companyId: fourWaysCompany.id },
      select: { id: true, mcNumberId: true },
    });
    for (const load of loads) {
      if (load.mcNumberId) {
        // Map the MC number ID
        const mappedMcId = getMappedMcNumberId(load.mcNumberId);
        if (mappedMcId) {
          await prisma.load.update({
            where: { id: load.id },
            data: { mcNumberId: mappedMcId },
          });
        }
      }
    }
    console.log(`✓ Updated ${loads.length} load MC numbers`);

    // 4. Update Drivers
    const driversUpdated = await prisma.driver.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${driversUpdated.count} drivers`);

    // Update driver MC numbers
    const drivers = await prisma.driver.findMany({
      where: { companyId: fourWaysCompany.id },
      select: { id: true, mcNumberId: true, mcNumber: { select: { number: true } } },
    });
    for (const driver of drivers) {
      if (driver.mcNumberId) {
        for (const [demoMcId, fourWaysMcId] of mcNumberMap.entries()) {
          if (driver.mcNumberId === demoMcId) {
            await prisma.driver.update({
              where: { id: driver.id },
              data: { mcNumberId: fourWaysMcId },
            });
          }
        }
      }
    }
    console.log(`✓ Updated ${drivers.length} driver MC numbers`);

    // 5. Update Trucks
    const trucksUpdated = await prisma.truck.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${trucksUpdated.count} trucks`);

    // Update truck MC numbers
    const trucks = await prisma.truck.findMany({
      where: { companyId: fourWaysCompany.id },
      select: { id: true, mcNumberId: true },
    });
    for (const truck of trucks) {
      if (truck.mcNumberId) {
        for (const [demoMcId, fourWaysMcId] of mcNumberMap.entries()) {
          if (truck.mcNumberId === demoMcId) {
            await prisma.truck.update({
              where: { id: truck.id },
              data: { mcNumberId: fourWaysMcId },
            });
          }
        }
      }
    }
    console.log(`✓ Updated ${trucks.length} truck MC numbers`);

    // 6. Update Trailers
    const trailersUpdated = await prisma.trailer.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${trailersUpdated.count} trailers`);

    // Update trailer MC numbers
    const trailers = await prisma.trailer.findMany({
      where: { companyId: fourWaysCompany.id },
      select: { id: true, mcNumberId: true },
    });
    for (const trailer of trailers) {
      if (trailer.mcNumberId) {
        for (const [demoMcId, fourWaysMcId] of mcNumberMap.entries()) {
          if (trailer.mcNumberId === demoMcId) {
            await prisma.trailer.update({
              where: { id: trailer.id },
              data: { mcNumberId: fourWaysMcId },
            });
          }
        }
      }
    }
    console.log(`✓ Updated ${trailers.length} trailer MC numbers`);

    // 7. Update Customers
    const customersUpdated = await prisma.customer.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${customersUpdated.count} customers`);

    // Update customer MC numbers
    const customers = await prisma.customer.findMany({
      where: { companyId: fourWaysCompany.id },
      select: { id: true, mcNumber: true },
    });
    for (const customer of customers) {
      if (customer.mcNumber && typeof customer.mcNumber === 'string') {
        for (const [demoMcId, fourWaysMcId] of mcNumberMap.entries()) {
          const demoMc = await prisma.mcNumber.findUnique({ where: { id: demoMcId }, select: { number: true } });
          if (demoMc && customer.mcNumber === demoMc.number) {
            const fourWaysMc = await prisma.mcNumber.findUnique({ where: { id: fourWaysMcId }, select: { number: true } });
            if (fourWaysMc) {
              await prisma.customer.update({
                where: { id: customer.id },
                data: { mcNumber: fourWaysMc.number },
              });
            }
          }
        }
      }
    }
    console.log(`✓ Updated ${customers.length} customer MC numbers`);

    // 8. Update Invoices (filtered through customers, but also check direct companyId if it exists)
    // Invoices are linked through customers, so they should already be updated
    // But if invoices have a direct companyId or mcNumber, update those too
    const invoices = await prisma.invoice.findMany({
      where: {
        customer: {
          companyId: fourWaysCompany.id,
        },
      },
      select: { id: true, mcNumber: true },
    });
    for (const invoice of invoices) {
      if (invoice.mcNumber && typeof invoice.mcNumber === 'string') {
        for (const [demoMcId, fourWaysMcId] of mcNumberMap.entries()) {
          const demoMc = await prisma.mcNumber.findUnique({ where: { id: demoMcId }, select: { number: true } });
          if (demoMc && invoice.mcNumber === demoMc.number) {
            const fourWaysMc = await prisma.mcNumber.findUnique({ where: { id: fourWaysMcId }, select: { number: true } });
            if (fourWaysMc) {
              await prisma.invoice.update({
                where: { id: invoice.id },
                data: { mcNumber: fourWaysMc.number },
              });
            }
          }
        }
      }
    }
    console.log(`✓ Updated ${invoices.length} invoice MC numbers`);

    // 9. Update Settlements (Settlement doesn't have mcNumber field, skip this)
    // Settlements are linked to drivers, which are already updated above
    console.log(`✓ Settlements will use drivers' company (already migrated)`);

    // 10. Update other entities that might have companyId
    const locationsUpdated = await prisma.location.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${locationsUpdated.count} locations`);

    const vendorsUpdated = await prisma.vendor.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${vendorsUpdated.count} vendors`);

    const projectsUpdated = await prisma.project.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${projectsUpdated.count} projects`);

    // Routes don't have companyId directly - they're linked to Loads
    // Routes will be migrated through Loads (already done above)
    console.log(`✓ Routes will use loads' company (already migrated)`);

    const inventoryItemsUpdated = await prisma.inventoryItem.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${inventoryItemsUpdated.count} inventory items`);

    // 11. Update Fuel Entries (FuelEntry doesn't have mcNumber field - skip this)
    // Fuel entries are linked to trucks and drivers which are already migrated above
    console.log(`✓ Fuel entries will use trucks'/drivers' company (already migrated)`);

    // 12. Update Maintenance Records (MaintenanceRecord doesn't have companyId or trailer relation)
    // Maintenance records are linked to trucks which are already migrated above
    console.log(`✓ Maintenance records will use trucks' company (already migrated)`);

    // 13. Update Breakdowns (through trucks)
    const breakdownsUpdated = await prisma.breakdown.updateMany({
      where: {
        truck: { companyId: fourWaysCompany.id },
      },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${breakdownsUpdated.count} breakdowns`);

    // 14. Update Inspections (Inspection doesn't have trailer relation)
    const inspectionsUpdated = await prisma.inspection.updateMany({
      where: {
        companyId: demoCompany.id,
      },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${inspectionsUpdated.count} inspections`);

    // 15. Update Safety Incidents (through drivers/trucks)
    const safetyIncidentsUpdated = await prisma.safetyIncident.updateMany({
      where: {
        OR: [
          { driver: { companyId: fourWaysCompany.id } },
          { truck: { companyId: fourWaysCompany.id } },
        ],
      },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${safetyIncidentsUpdated.count} safety incidents`);

    // 16. Update Safety Training (through drivers)
    const safetyTrainingUpdated = await prisma.safetyTraining.updateMany({
      where: {
        driver: { companyId: fourWaysCompany.id },
      },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${safetyTrainingUpdated.count} safety training records`);

    // 17. Update Documents (Document doesn't have trailer or customer relations)
    const documentsUpdated = await prisma.document.updateMany({
      where: {
        companyId: demoCompany.id,
      },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${documentsUpdated.count} documents`);

    // 18. Update Activity Logs (through users)
    // Activity logs might have companyId, update if needed
    const activityLogsUpdated = await prisma.activityLog.updateMany({
      where: { companyId: demoCompany.id },
      data: { companyId: fourWaysCompany.id },
    });
    console.log(`✓ Updated ${activityLogsUpdated.count} activity logs`);

    // 19. Delete Demo Trucking LLC MC Numbers (after migration)
    if (demoMcNumbers.length > 0) {
      await prisma.mcNumber.deleteMany({
        where: { id: { in: demoMcNumbers.map(mc => mc.id) } },
      });
      console.log(`✓ Deleted ${demoMcNumbers.length} Demo Trucking LLC MC number(s)`);
    }

    // 20. Optional: Delete Demo Trucking LLC company
    // Uncomment the next lines if you want to delete the company too
    // await prisma.company.delete({
    //   where: { id: demoCompany.id },
    // });
    // console.log(`✓ Deleted Demo Trucking LLC company`);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('All data from Demo Trucking LLC has been moved to Four Ways Logistics.');
    console.log('MC numbers have been mapped and updated accordingly.');
    console.log('');
    console.log('Note: Demo Trucking LLC company still exists. If you want to delete it,');
    console.log('uncomment the deletion code at the end of the script.');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateDemoToFourWays()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

