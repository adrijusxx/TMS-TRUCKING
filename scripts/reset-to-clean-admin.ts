import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * This script completely resets the database and creates a clean setup with:
 * - One company
 * - One MC number
 * - One admin user
 * 
 * WARNING: This will delete ALL data from the database!
 */
async function resetToCleanAdmin() {
  console.log('🗑️  Starting complete database reset...');
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('');
  
  try {
    // ============================================
    // STEP 1: Delete ALL data
    // ============================================
    console.log('📦 Step 1: Deleting all existing data...');
    
    // Delete ALL models in correct order (respecting foreign key constraints)
    // We need to delete children before parents to avoid foreign key violations
    console.log('Deleting all records from all tables...');
    
    // Group 1: Delete most nested child records first (records that don't have children)
    console.log('  Step 1: Deleting nested child records...');
    await Promise.all([
      // Safety & Compliance - most nested
      prisma.campaignParticipant.deleteMany({}),
      prisma.safetyRecognition.deleteMany({}),
      prisma.policyAcknowledgment.deleteMany({}),
      prisma.meetingAttendance.deleteMany({}),
      prisma.complianceActionItem.deleteMany({}),
      prisma.witnessStatement.deleteMany({}),
      prisma.policeReport.deleteMany({}),
      prisma.nearMiss.deleteMany({}),
      prisma.preventableVote.deleteMany({}),
      prisma.accidentPhoto.deleteMany({}),
      prisma.defect.deleteMany({}),
      prisma.roadsideViolation.deleteMany({}),
      prisma.dVIRDefect.deleteMany({}),
      prisma.hOSViolation.deleteMany({}),
      prisma.randomSelectedDriver.deleteMany({}),
      prisma.randomSelection.deleteMany({}),
      prisma.testingPoolDriver.deleteMany({}),
      prisma.mVRViolation.deleteMany({}),
      prisma.dQFDocument.deleteMany({}),
      // Insurance
      prisma.lossRun.deleteMany({}),
      prisma.propertyDamage.deleteMany({}),
      // Load related
      prisma.loadSegment.deleteMany({}),
      prisma.loadStop.deleteMany({}),
      prisma.loadStatusHistory.deleteMany({}),
      prisma.loadTag.deleteMany({}),
      prisma.loadExpense.deleteMany({}),
      // Invoice related
      prisma.invoiceBatchItem.deleteMany({}),
      prisma.invoiceTag.deleteMany({}),
      // Settlement related
      prisma.settlementDeduction.deleteMany({}),
      prisma.settlementApproval.deleteMany({}),
      // IFTA
      prisma.iFTAStateMileage.deleteMany({}),
      // Driver related
      prisma.driverComment.deleteMany({}),
      prisma.driverTrailerHistory.deleteMany({}),
      prisma.driverTruckHistory.deleteMany({}),
      prisma.driverTag.deleteMany({}),
      // Vehicle related
      prisma.truckTag.deleteMany({}),
      // Customer/Vendor related
      prisma.customerContact.deleteMany({}),
      prisma.customerTag.deleteMany({}),
      prisma.vendorContact.deleteMany({}),
      // Other nested
      prisma.task.deleteMany({}),
      prisma.onCallShift.deleteMany({}),
      prisma.userColumnPreference.deleteMany({}),
    ]);
    
    // Group 2: Delete records that reference loads/invoices (MUST delete before Load/Invoice)
    console.log('  Step 2: Deleting records that reference loads...');
    await Promise.all([
      prisma.accessorialCharge.deleteMany({}), // References Load
      prisma.rateConfirmation.deleteMany({}), // References Load
      prisma.iFTAEntry.deleteMany({}), // References Load
      prisma.driverAdvance.deleteMany({}), // References Load
    ]);
    
    // Group 3: Delete parent records (Loads, Invoices, etc.)
    console.log('  Step 3: Deleting parent records (loads, invoices, etc.)...');
    await Promise.all([
      // Loads (must come after accessorialCharge, rateConfirmation, etc.)
      prisma.load.deleteMany({}),
      // Invoices
      prisma.invoice.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.reconciliation.deleteMany({}),
      prisma.invoiceBatch.deleteMany({}),
      // Settlements
      prisma.settlement.deleteMany({}),
      // IFTA
      prisma.iFTAConfig.deleteMany({}),
      // Fuel & HOS
      prisma.fuelEntry.deleteMany({}),
      prisma.hOSRecord.deleteMany({}),
      // Drivers
      prisma.driver.deleteMany({}),
      // Vehicles
      prisma.trailer.deleteMany({}),
      prisma.truck.deleteMany({}),
      // Maintenance
      prisma.maintenanceRecord.deleteMany({}),
      prisma.breakdown.deleteMany({}),
      prisma.inspection.deleteMany({}),
      // Inventory
      prisma.inventoryTransaction.deleteMany({}),
      prisma.inventoryItem.deleteMany({}),
      // Documents
      prisma.document.deleteMany({}),
      // Customers & Vendors
      prisma.customer.deleteMany({}),
      prisma.vendor.deleteMany({}),
      // Other
      prisma.location.deleteMany({}),
      prisma.project.deleteMany({}),
      prisma.route.deleteMany({}),
      prisma.communication.deleteMany({}),
      prisma.activityLog.deleteMany({}),
      prisma.auditLog.deleteMany({}),
      prisma.notificationPreferences.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.integration.deleteMany({}),
      prisma.tag.deleteMany({}),
      // Safety parent records
      prisma.safetyTraining.deleteMany({}),
      prisma.safetyIncident.deleteMany({}),
      prisma.safetyCampaign.deleteMany({}),
      prisma.safetyPolicy.deleteMany({}),
      prisma.safetyMeeting.deleteMany({}),
      prisma.complianceAlert.deleteMany({}),
      prisma.trainingMaterial.deleteMany({}),
      prisma.dataQSubmission.deleteMany({}),
      prisma.complianceReview.deleteMany({}),
      prisma.fMCSACompliance.deleteMany({}),
      prisma.cSAScore.deleteMany({}),
      prisma.preventableDetermination.deleteMany({}),
      prisma.investigation.deleteMany({}),
      prisma.outOfServiceOrder.deleteMany({}),
      prisma.roadsideInspection.deleteMany({}),
      prisma.dVIR.deleteMany({}),
      prisma.annualReview.deleteMany({}),
      prisma.eLDSyncLog.deleteMany({}),
      prisma.eLDProvider.deleteMany({}),
      prisma.fMCSAClearinghouseQuery.deleteMany({}),
      prisma.testingPool.deleteMany({}),
      prisma.drugAlcoholTest.deleteMany({}),
      prisma.mVRRecord.deleteMany({}),
      prisma.cDLRecord.deleteMany({}),
      prisma.medicalCard.deleteMany({}),
      prisma.driverQualificationFile.deleteMany({}),
      // Insurance parent records
      prisma.cargoClaim.deleteMany({}),
      prisma.insuranceClaim.deleteMany({}),
      prisma.insuranceCertificate.deleteMany({}),
      prisma.insurancePolicy.deleteMany({}),
      // Configurations
      prisma.aISuggestion.deleteMany({}),
      prisma.customField.deleteMany({}),
      prisma.companySettings.deleteMany({}),
      prisma.apiCache.deleteMany({}),
      prisma.netProfitFormula.deleteMany({}),
      prisma.classification.deleteMany({}),
      prisma.reportConstructor.deleteMany({}),
      prisma.reportTemplate.deleteMany({}),
      prisma.safetyConfiguration.deleteMany({}),
      prisma.workOrderType.deleteMany({}),
      prisma.defaultConfiguration.deleteMany({}),
      prisma.documentTemplate.deleteMany({}),
      prisma.dynamicStatus.deleteMany({}),
      prisma.orderPaymentType.deleteMany({}),
      prisma.paymentConfiguration.deleteMany({}),
      prisma.tariffRule.deleteMany({}),
      prisma.tariff.deleteMany({}),
      prisma.expenseType.deleteMany({}),
      prisma.expenseCategory.deleteMany({}),
      prisma.deductionRule.deleteMany({}),
      prisma.factoringCompany.deleteMany({}),
    ]);
    
    // Group 4: Delete Users & Companies (delete last)
    console.log('  Step 4: Deleting users and companies...');
    await Promise.all([
      prisma.userCompany.deleteMany({}),
      prisma.mcNumber.deleteMany({}),
      prisma.user.deleteMany({}),
      prisma.company.deleteMany({}),
    ]);
    
    console.log('✅ All data deleted');
    console.log('');
    
    // ============================================
    // STEP 2: Create Company
    // ============================================
    console.log('🏢 Step 2: Creating company...');
    
    const company = await prisma.company.create({
      data: {
        name: 'Your Company',
        dotNumber: '0000000',
        mcNumber: 'MC-000000',
        address: '123 Main St',
        city: 'Your City',
        state: 'TX',
        zip: '75001',
        phone: '555-0000',
        email: 'admin@yourcompany.com',
        isActive: true,
      },
    });
    
    console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);
    console.log('');
    
    // ============================================
    // STEP 3: Create MC Number
    // ============================================
    console.log('🚛 Step 3: Creating MC number...');
    
    const mcNumber = await prisma.mcNumber.create({
      data: {
        companyId: company.id,
        companyName: company.name.toUpperCase(),
        number: '000000',
        type: 'CARRIER',
        isDefault: true,
        companyPhone: company.phone,
      },
    });
    
    console.log(`✅ MC Number created: ${mcNumber.companyName} (MC ${mcNumber.number})`);
    console.log('');
    
    // ============================================
    // STEP 4: Create Admin User
    // ============================================
    console.log('👤 Step 4: Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@yourcompany.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '555-0001',
        role: 'ADMIN',
        companyId: company.id,
        mcNumberId: mcNumber.id,
        isActive: true,
      },
    });
    
    console.log(`✅ Admin user created: ${adminUser.email}`);
    console.log('');
    
    // ============================================
    // SUCCESS!
    // ============================================
    console.log('🎉 Database reset completed successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
    console.log('');
    console.log('✅ Your database is now clean with only one admin user.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetToCleanAdmin()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

