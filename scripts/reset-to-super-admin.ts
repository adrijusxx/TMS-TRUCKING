import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * This script completely resets the database and creates a clean setup with:
 * - One company
 * - One MC number
 * - One SUPER ADMIN user
 * 
 * WARNING: This will delete ALL data from the database!
 */
async function resetToSuperAdmin() {
    console.log('os Start complete database reset...');
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('');

    try {
        // ============================================
        // STEP 1: Delete ALL data
        // ============================================
        console.log('📦 Step 1: Deleting all existing data...');

        // Group 1: Delete most nested child records first
        await Promise.all([
            // Safety & Compliance
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

        // Group 2: Records referring to loads
        await Promise.all([
            prisma.accessorialCharge.deleteMany({}),
            prisma.rateConfirmation.deleteMany({}),
            prisma.iFTAEntry.deleteMany({}),
            prisma.driverAdvance.deleteMany({}),
        ]);

        // Group 3: Parent records
        await Promise.all([
            prisma.load.deleteMany({}),
            prisma.invoice.deleteMany({}),
            prisma.payment.deleteMany({}),
            prisma.reconciliation.deleteMany({}),
            prisma.invoiceBatch.deleteMany({}),
            prisma.settlement.deleteMany({}),
            prisma.iFTAConfig.deleteMany({}),
            prisma.fuelEntry.deleteMany({}),
            prisma.hOSRecord.deleteMany({}),
            prisma.driver.deleteMany({}),
            prisma.trailer.deleteMany({}),
            prisma.truck.deleteMany({}),
            prisma.maintenanceRecord.deleteMany({}),
            prisma.breakdown.deleteMany({}),
            prisma.inspection.deleteMany({}),
            prisma.inventoryTransaction.deleteMany({}),
            prisma.inventoryItem.deleteMany({}),
            prisma.document.deleteMany({}),
            prisma.customer.deleteMany({}),
            prisma.vendor.deleteMany({}),
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
            prisma.cargoClaim.deleteMany({}),
            prisma.insuranceClaim.deleteMany({}),
            prisma.insuranceCertificate.deleteMany({}),
            prisma.insurancePolicy.deleteMany({}),
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

        // Group 4: Users & Companies (Sequential to avoid FK constraints)
        await prisma.userCompany.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.mcNumber.deleteMany({});
        await prisma.company.deleteMany({});

        console.log('✅ All data deleted');
        console.log('');

        // ============================================
        // STEP 2: Create Company
        // ============================================
        console.log('🏢 Step 2: Creating company...');

        const company = await prisma.company.create({
            data: {
                name: 'Super Admin Co',
                dotNumber: '9999999',
                mcNumber: 'MC-999999',
                address: '1 Admin Way',
                city: 'Admin City',
                state: 'TX',
                zip: '00000',
                phone: '555-0000',
                email: 'superadmin@example.com',
                isActive: true,
            },
        });

        console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);

        // ============================================
        // STEP 3: Create MC Number
        // ============================================
        console.log('🚛 Step 3: Creating MC number...');

        const mcNumber = await prisma.mcNumber.create({
            data: {
                companyId: company.id,
                companyName: company.name.toUpperCase(),
                number: '999999',
                type: 'CARRIER',
                isDefault: true,
                companyPhone: company.phone,
            },
        });

        console.log(`✅ MC Number created: ${mcNumber.number}`);

        // ============================================
        // STEP 4: Create Super Admin User
        // ============================================
        console.log('👤 Step 4: Creating SUPER ADMIN user...');

        const hashedPassword = await bcrypt.hash('superadmin123', 10);

        const adminUser = await prisma.user.create({
            data: {
                email: 'superadmin@example.com',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                phone: '555-9999',
                role: 'SUPER_ADMIN',
                companyId: company.id,
                mcNumberId: mcNumber.id,
                mcAccess: [], // Access to all
                isActive: true,
            },
        });

        console.log(`✅ SUPER ADMIN user created: ${adminUser.email}`);
        console.log('');
        console.log('🎉 Database reset completed successfully!');
        console.log('📋 Login Credentials:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: superadmin123`);
        console.log('');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

resetToSuperAdmin()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    });
