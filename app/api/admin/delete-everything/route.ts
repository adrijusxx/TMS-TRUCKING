import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const deleteEverythingSchema = z.object({
  confirmText: z.literal('DELETE EVERYTHING'),
});

/**
 * POST /api/admin/delete-everything
 * Permanently delete ALL data except Company and MC Number records
 * ADMIN ONLY - Very dangerous operation!
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Strict admin-only check
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = deleteEverythingSchema.parse(body);

    if (validated.confirmText !== 'DELETE EVERYTHING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CONFIRMATION', message: 'Invalid confirmation text' } },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    console.log(`[DELETE EVERYTHING] Starting deletion for company ${companyId} by user ${session.user.id}`);

    // Delete in order to respect foreign key constraints
    // We'll delete everything EXCEPT Company and McNumber records

    const deletionResults: Record<string, number> = {};

    try {
      // 1. Delete child records first (those with foreign keys to other records)
      deletionResults.activityLogs = (await prisma.activityLog.deleteMany({
        where: { companyId },
      })).count;

      // AuditLog doesn't have companyId - delete by filtering through users
      const companyUserIds = await prisma.user.findMany({
        where: { companyId },
        select: { id: true },
      });
      const userIds = companyUserIds.map(u => u.id);
      deletionResults.auditLogs = (await prisma.auditLog.deleteMany({
        where: { userId: { in: userIds } },
      })).count;

      // Notification doesn't have companyId - delete by filtering through users
      deletionResults.notifications = (await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      })).count;

      // NotificationPreferences is also user-based
      deletionResults.notificationPreferences = (await prisma.notificationPreferences.deleteMany({
        where: { userId: { in: userIds } },
      })).count;

      // 2. Delete load-related records (must delete records that reference Load before deleting Loads)
      // First delete RateConfirmations and AccessorialCharges that reference loads
      deletionResults.rateConfirmations = (await prisma.rateConfirmation.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.accessorialCharges = (await prisma.accessorialCharge.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.loadStops = (await prisma.loadStop.deleteMany({
        where: { load: { companyId } },
      })).count;

      deletionResults.loadStatusHistory = (await prisma.loadStatusHistory.deleteMany({
        where: { load: { companyId } },
      })).count;

      deletionResults.loadSegments = (await prisma.loadSegment.deleteMany({
        where: { load: { companyId } },
      })).count;

      deletionResults.loadTags = (await prisma.loadTag.deleteMany({
        where: { load: { companyId } },
      })).count;

      deletionResults.loadExpenses = (await prisma.loadExpense.deleteMany({
        where: { load: { companyId } },
      })).count;

      deletionResults.loads = (await prisma.load.deleteMany({
        where: { companyId },
      })).count;

      // LoadTemplate and LoadTemplateStop may not exist in all databases - wrap in try-catch
      try {
        // First get all template IDs for this company
        const templateIds = await prisma.loadTemplate.findMany({
          where: { companyId },
          select: { id: true },
        });
        
        if (templateIds.length > 0) {
          // Delete LoadTemplateStop first (if it exists)
          try {
            await prisma.loadTemplateStop.deleteMany({
              where: { templateId: { in: templateIds.map(t => t.id) } },
            });
          } catch (error: any) {
            if (error.code !== 'P2021') throw error;
            // Table doesn't exist, continue
          }
        }
        
        deletionResults.loadTemplates = (await prisma.loadTemplate.deleteMany({
          where: { companyId },
        })).count;
      } catch (error: any) {
        if (error.code === 'P2021') { // P2021 = table doesn't exist
          deletionResults.loadTemplates = 0;
          console.log('LoadTemplate table does not exist, skipping deletion');
        } else {
          throw error;
        }
      }

      // 3. Delete invoice-related records
      deletionResults.invoiceBatchItems = (await prisma.invoiceBatchItem.deleteMany({
        where: { batch: { companyId } },
      })).count;

      deletionResults.invoiceBatches = (await prisma.invoiceBatch.deleteMany({
        where: { companyId },
      })).count;

      // Payment doesn't have companyId - need to find IDs through related entities
      // Reuse userIds from above, get other related IDs
      const [companyInvoiceIds, companyFuelEntryIds, companyBreakdownIds] = await Promise.all([
        prisma.invoice.findMany({ 
          where: { customer: { companyId } }, 
          select: { id: true } 
        }),
        prisma.fuelEntry.findMany({ where: { truck: { companyId } }, select: { id: true } }),
        prisma.breakdown.findMany({ where: { companyId }, select: { id: true } }),
      ]);

      const invoiceIds = companyInvoiceIds.map(i => i.id);
      const fuelEntryIds = companyFuelEntryIds.map(f => f.id);
      const breakdownIds = companyBreakdownIds.map(b => b.id);

      // Find payments that match any of these IDs
      const paymentsToDelete = await prisma.payment.findMany({
        where: {
          OR: [
            { createdById: { in: userIds } },
            { invoiceId: { in: invoiceIds } },
            { fuelEntryId: { in: fuelEntryIds } },
            { breakdownId: { in: breakdownIds } },
          ],
        },
        select: { id: true },
      });
      
      if (paymentsToDelete.length > 0) {
        deletionResults.payments = (await prisma.payment.deleteMany({
          where: {
            id: { in: paymentsToDelete.map(p => p.id) },
          },
        })).count;
      } else {
        deletionResults.payments = 0;
      }

      deletionResults.reconciliations = (await prisma.reconciliation.deleteMany({
        where: { invoice: { customer: { companyId } } },
      })).count;

      deletionResults.invoices = (await prisma.invoice.deleteMany({
        where: { customer: { companyId } },
      })).count;

      // 4. Delete settlement-related records
      deletionResults.settlementDeductions = (await prisma.settlementDeduction.deleteMany({
        where: { settlement: { driver: { companyId } } },
      })).count;

      deletionResults.settlementApprovals = (await prisma.settlementApproval.deleteMany({
        where: { settlement: { driver: { companyId } } },
      })).count;

      deletionResults.settlements = (await prisma.settlement.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.driverAdvances = (await prisma.driverAdvance.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.driverNegativeBalances = (await prisma.driverNegativeBalance.deleteMany({
        where: { driver: { companyId } },
      })).count;

      // 5. Delete driver-related records
      deletionResults.driverComments = (await prisma.driverComment.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.driverTruckHistory = (await prisma.driverTruckHistory.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.driverTrailerHistory = (await prisma.driverTrailerHistory.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.driverTags = (await prisma.driverTag.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.hosRecords = (await prisma.hOSRecord.deleteMany({
        where: { driver: { companyId } },
      })).count;

      deletionResults.drivers = (await prisma.driver.deleteMany({
        where: { companyId },
      })).count;

      // 6. Delete vehicle-related records
      deletionResults.maintenanceRecords = (await prisma.maintenanceRecord.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.breakdowns = (await prisma.breakdown.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.inspections = (await prisma.inspection.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.fuelEntries = (await prisma.fuelEntry.deleteMany({
        where: { truck: { companyId } },
      })).count;

      deletionResults.trucks = (await prisma.truck.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.trailers = (await prisma.trailer.deleteMany({
        where: { companyId },
      })).count;

      // 7. Delete customer-related records
      deletionResults.customerContacts = (await prisma.customerContact.deleteMany({
        where: { customer: { companyId } },
      })).count;

      deletionResults.customerTags = (await prisma.customerTag.deleteMany({
        where: { customer: { companyId } },
      })).count;

      deletionResults.customers = (await prisma.customer.deleteMany({
        where: { companyId },
      })).count;

      // 8. Delete other records
      deletionResults.documents = (await prisma.document.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.vendors = (await prisma.vendor.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.locations = (await prisma.location.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.routes = (await prisma.route.deleteMany({
        where: { load: { companyId } },
      })).count;

      deletionResults.communications = (await prisma.communication.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.onCallShifts = (await prisma.onCallShift.deleteMany({
        where: { companyId },
      })).count;

      // 9. Delete safety records
      deletionResults.meetingAttendance = (await prisma.meetingAttendance.deleteMany({
        where: { meeting: { companyId } },
      })).count;

      deletionResults.safetyMeetings = (await prisma.safetyMeeting.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.safetyPolicies = (await prisma.safetyPolicy.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.safetyCampaigns = (await prisma.safetyCampaign.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.safetyIncidents = (await prisma.safetyIncident.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.safetyTrainings = (await prisma.safetyTraining.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.complianceAlerts = (await prisma.complianceAlert.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.complianceReviews = (await prisma.complianceReview.deleteMany({
        where: { compliance: { companyId } },
      })).count;

      deletionResults.fmcsaCompliance = (await prisma.fMCSACompliance.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.csaScores = (await prisma.cSAScore.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.dataQSubmissions = (await prisma.dataQSubmission.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.trainingMaterials = (await prisma.trainingMaterial.deleteMany({
        where: { companyId },
      })).count;

      // 10. Delete IFTA records
      deletionResults.iftaStateMileage = (await prisma.iFTAStateMileage.deleteMany({
        where: { iftaEntry: { companyId } },
      })).count;

      deletionResults.iftaEntries = (await prisma.iFTAEntry.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.iftaConfigs = (await prisma.iFTAConfig.deleteMany({
        where: { companyId },
      })).count;

      // 11. Delete accounting-related records
      deletionResults.factoringBatches = (await prisma.factoringBatch.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.factoringCompanies = (await prisma.factoringCompany.deleteMany({
        where: { companyId },
      })).count;

      // Note: rateConfirmations and accessorialCharges already deleted earlier (before loads due to FK constraints)

      // 12. Delete inventory records
      deletionResults.inventoryTransactions = (await prisma.inventoryTransaction.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.inventoryItems = (await prisma.inventoryItem.deleteMany({
        where: { companyId },
      })).count;

      // 13. Delete configuration records (but keep company structure)
      deletionResults.deductionRules = (await prisma.deductionRule.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.paymentConfigurations = (await prisma.paymentConfiguration.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.orderPaymentTypes = (await prisma.orderPaymentType.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.dynamicStatuses = (await prisma.dynamicStatus.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.documentTemplates = (await prisma.documentTemplate.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.defaultConfigurations = (await prisma.defaultConfiguration.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.expenseTypes = (await prisma.expenseType.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.expenseCategories = (await prisma.expenseCategory.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.tariffs = (await prisma.tariff.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.tariffRules = (await prisma.tariffRule.deleteMany({
        where: { tariff: { companyId } },
      })).count;

      deletionResults.tags = (await prisma.tag.deleteMany({
        where: { companyId },
      })).count;

      deletionResults.integrations = (await prisma.integration.deleteMany({
        where: { companyId },
      })).count;

      // 14. Delete user-company associations (but keep users and companies)
      deletionResults.userCompanies = (await prisma.userCompany.deleteMany({
        where: { companyId },
      })).count;

      // 15. Delete users (but this might break things, so we'll keep them for now)
      // Actually, let's delete non-admin users only to be safe
      deletionResults.users = (await prisma.user.deleteMany({
        where: {
          companyId,
          role: { not: 'ADMIN' },
        },
      })).count;

      // NOTE: We are NOT deleting:
      // - Company records (kept)
      // - McNumber records (kept)
      // - Admin users (kept for safety)

      const totalDeleted = Object.values(deletionResults).reduce((sum, count) => sum + count, 0);

      console.log(`[DELETE EVERYTHING] Completed deletion for company ${companyId}. Total records deleted: ${totalDeleted}`);

      return NextResponse.json({
        success: true,
        data: {
          deleted: totalDeleted,
          details: deletionResults,
          message: `Successfully deleted ${totalDeleted} records. Company and MC Number records were preserved.`,
        },
      });
    } catch (error: any) {
      console.error('[DELETE EVERYTHING] Error during deletion:', error);
      throw error;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid confirmation text. Must type "DELETE EVERYTHING" exactly.',
          },
        },
        { status: 400 }
      );
    }

    console.error('Delete everything error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete all records',
        },
      },
      { status: 500 }
    );
  }
}

