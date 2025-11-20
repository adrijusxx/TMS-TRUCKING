import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script completely resets the database by deleting all data
 * WARNING: This will delete ALL data from the database!
 */
async function resetDatabase() {
  console.log('🗑️  Starting database reset...');
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  
  try {
    // Delete all data in the correct order (respecting foreign key constraints)
    // Start with tables that have foreign keys to others
    
    console.log('Deleting all data...');
    
    // Activity logs
    await prisma.activityLog.deleteMany({});
    console.log('✓ Activity logs deleted');
    
    // Documents
    await prisma.document.deleteMany({});
    console.log('✓ Documents deleted');
    
    // Load-related data
    await prisma.loadStop.deleteMany({});
    await prisma.loadStatusHistory.deleteMany({});
    await prisma.loadTag.deleteMany({});
    await prisma.load.deleteMany({});
    console.log('✓ Loads and related data deleted');
    
    // Invoice-related
    await prisma.invoiceBatch.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.reconciliation.deleteMany({});
    await prisma.invoice.deleteMany({});
    console.log('✓ Invoices and related data deleted');
    
    // Settlement
    await prisma.settlement.deleteMany({});
    console.log('✓ Settlements deleted');
    
    // Safety
    await prisma.safetyTraining.deleteMany({});
    await prisma.safetyIncident.deleteMany({});
    console.log('✓ Safety records deleted');
    
    // Maintenance & Breakdowns
    await prisma.maintenanceRecord.deleteMany({});
    await prisma.breakdown.deleteMany({});
    await prisma.inspection.deleteMany({});
    console.log('✓ Maintenance, breakdowns, and inspections deleted');
    
    // Inventory
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    console.log('✓ Inventory deleted');
    
    // Fuel & HOS
    await prisma.fuelEntry.deleteMany({});
    await prisma.hOSRecord.deleteMany({});
    console.log('✓ Fuel entries and HOS records deleted');
    
    // Drivers
    await prisma.driverComment.deleteMany({});
    await prisma.driver.deleteMany({});
    console.log('✓ Drivers and related data deleted');
    
    // Vehicles
    await prisma.trailer.deleteMany({});
    await prisma.truck.deleteMany({});
    console.log('✓ Trucks and trailers deleted');
    
    // Customers & Vendors
    await prisma.customer.deleteMany({});
    await prisma.vendor.deleteMany({});
    console.log('✓ Customers and vendors deleted');
    
    // Locations
    await prisma.location.deleteMany({});
    console.log('✓ Locations deleted');
    
    // Projects & Tasks
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    console.log('✓ Projects and tasks deleted');
    
    // Routes
    await prisma.route.deleteMany({});
    console.log('✓ Routes deleted');
    
    // Settings & Configurations
    await prisma.notificationPreferences.deleteMany({});
    await prisma.userCompany.deleteMany({});
    await prisma.mcNumber.deleteMany({});
    console.log('✓ Settings and configurations deleted');
    
    // Configuration & Settings models
    await prisma.expenseType.deleteMany({});
    await prisma.expenseCategory.deleteMany({});
    await prisma.tariffRule.deleteMany({});
    await prisma.tariff.deleteMany({});
    await prisma.orderPaymentType.deleteMany({});
    await prisma.dynamicStatus.deleteMany({});
    await prisma.documentTemplate.deleteMany({});
    await prisma.defaultConfiguration.deleteMany({});
    await prisma.workOrderType.deleteMany({});
    await prisma.safetyConfiguration.deleteMany({});
    await prisma.reportTemplate.deleteMany({});
    await prisma.reportConstructor.deleteMany({});
    await prisma.netProfitFormula.deleteMany({});
    await prisma.classification.deleteMany({});
    await prisma.paymentConfiguration.deleteMany({});
    console.log('✓ Configuration and settings deleted');
    
    // Tags
    await prisma.invoiceTag.deleteMany({});
    await prisma.customerTag.deleteMany({});
    await prisma.truckTag.deleteMany({});
    await prisma.driverTag.deleteMany({});
    await prisma.tag.deleteMany({});
    console.log('✓ Tags deleted');
    
    // Notifications
    await prisma.notification.deleteMany({});
    console.log('✓ Notifications deleted');
    
    // Audit logs
    await prisma.auditLog.deleteMany({});
    console.log('✓ Audit logs deleted');
    
    // Integration
    await prisma.integration.deleteMany({});
    console.log('✓ Integrations deleted');
    
    // Customer contacts & vendor contacts
    await prisma.customerContact.deleteMany({});
    await prisma.vendorContact.deleteMany({});
    console.log('✓ Contacts deleted');
    
    // Driver documents are handled by Document model (already deleted above)
    console.log('✓ Driver documents deleted (handled by Document model)');
    
    // Driver truck & trailer history
    await prisma.driverTrailerHistory.deleteMany({});
    await prisma.driverTruckHistory.deleteMany({});
    console.log('✓ Driver history deleted');
    
    // Users (delete all users)
    await prisma.user.deleteMany({});
    console.log('✓ Users deleted');
    
    // Companies (delete all companies)
    await prisma.company.deleteMany({});
    console.log('✓ Companies deleted');
    
    console.log('✅ Database reset completed successfully!');
    console.log('');
    console.log('All data has been deleted. The database is now clean and ready for fresh data.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create a new company through the application');
    console.log('2. Create MC numbers for that company');
    console.log('3. Upload your test data');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

