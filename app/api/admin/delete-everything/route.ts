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
      deletionResults.activityLogs = await prisma.activityLog.deleteMany({
        where: { companyId },
      });

      // AuditLog doesn't have companyId - delete by filtering through users
      const companyUserIds = await prisma.user.findMany({
        where: { companyId },
        select: { id: true },
      });
      const userIds = companyUserIds.map(u => u.id);
      deletionResults.auditLogs = await prisma.auditLog.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Notification doesn't have companyId - delete by filtering through users
      deletionResults.notifications = await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });

      // NotificationPreferences is also user-based
      deletionResults.notificationPreferences = await prisma.notificationPreferences.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 2. Delete load-related records (must delete records that reference Load before deleting Loads)
      // First delete RateConfirmations and AccessorialCharges that reference loads
      deletionResults.rateConfirmations = await prisma.rateConfirmation.deleteMany({
        where: { companyId },
      });

      deletionResults.accessorialCharges = await prisma.accessorialCharge.deleteMany({
        where: { companyId },
      });

      deletionResults.loadStops = await prisma.loadStop.deleteMany({
        where: { load: { companyId } },
      });

      deletionResults.loadStatusHistory = await prisma.loadStatusHistory.deleteMany({
        where: { load: { companyId } },
      });

      deletionResults.loadSegments = await prisma.loadSegment.deleteMany({
        where: { load: { companyId } },
      });

      deletionResults.loadTags = await prisma.loadTag.deleteMany({
        where: { load: { companyId } },
      });

      deletionResults.loadExpenses = await prisma.loadExpense.deleteMany({
        where: { load: { companyId } },
      });

      deletionResults.loads = await prisma.load.deleteMany({
        where: { companyId },
      });

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
        
        deletionResults.loadTemplates = await prisma.loadTemplate.deleteMany({
          where: { companyId },
        });
      } catch (error: any) {
        if (error.code === 'P2021') { // P2021 = table doesn't exist
          deletionResults.loadTemplates = 0;
          console.log('LoadTemplate table does not exist, skipping deletion');
        } else {
          throw error;
        }
      }

      // 3. Delete invoice-related records
      deletionResults.invoiceBatchItems = await prisma.invoiceBatchItem.deleteMany({
        where: { batch: { companyId } },
      });

      deletionResults.invoiceBatches = await prisma.invoiceBatch.deleteMany({
        where: { companyId },
      });

      // Payment doesn't have companyId - need to find IDs through related entities
      // Reuse userIds from above, get other related IDs
      const [companyInvoiceIds, companyFuelEntryIds, companyBreakdownIds] = await Promise.all([
        prisma.invoice.findMany({ 
          where: { customer: { companyId } }, 
          select: { id: true } 
        }),
        prisma.fuelEntry.findMany({ where: { companyId }, select: { id: true } }),
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
        deletionResults.payments = await prisma.payment.deleteMany({
          where: {
            id: { in: paymentsToDelete.map(p => p.id) },
          },
        });
      } else {
        deletionResults.payments = 0;
      }

      deletionResults.reconciliations = await prisma.reconciliation.deleteMany({
        where: { companyId },
      });

      deletionResults.invoices = await prisma.invoice.deleteMany({
        where: { customer: { companyId } },
      });

      // 4. Delete settlement-related records
      deletionResults.settlementDeductions = await prisma.settlementDeduction.deleteMany({
        where: { settlement: { driver: { companyId } } },
      });

      deletionResults.settlementApprovals = await prisma.settlementApproval.deleteMany({
        where: { settlement: { driver: { companyId } } },
      });

      deletionResults.settlements = await prisma.settlement.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.driverAdvances = await prisma.driverAdvance.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.driverNegativeBalances = await prisma.driverNegativeBalance.deleteMany({
        where: { driver: { companyId } },
      });

      // 5. Delete driver-related records
      deletionResults.driverComments = await prisma.driverComment.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.driverTruckHistory = await prisma.driverTruckHistory.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.driverTrailerHistory = await prisma.driverTrailerHistory.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.driverTags = await prisma.driverTag.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.hosRecords = await prisma.hOSRecord.deleteMany({
        where: { driver: { companyId } },
      });

      deletionResults.drivers = await prisma.driver.deleteMany({
        where: { companyId },
      });

      // 6. Delete vehicle-related records
      deletionResults.maintenanceRecords = await prisma.maintenanceRecord.deleteMany({
        where: { companyId },
      });

      deletionResults.breakdowns = await prisma.breakdown.deleteMany({
        where: { companyId },
      });

      deletionResults.inspections = await prisma.inspection.deleteMany({
        where: { companyId },
      });

      deletionResults.fuelEntries = await prisma.fuelEntry.deleteMany({
        where: { companyId },
      });

      deletionResults.trucks = await prisma.truck.deleteMany({
        where: { companyId },
      });

      deletionResults.trailers = await prisma.trailer.deleteMany({
        where: { companyId },
      });

      // 7. Delete customer-related records
      deletionResults.customerContacts = await prisma.customerContact.deleteMany({
        where: { customer: { companyId } },
      });

      deletionResults.customerTags = await prisma.customerTag.deleteMany({
        where: { customer: { companyId } },
      });

      deletionResults.customers = await prisma.customer.deleteMany({
        where: { companyId },
      });

      // 8. Delete other records
      deletionResults.documents = await prisma.document.deleteMany({
        where: { companyId },
      });

      deletionResults.vendors = await prisma.vendor.deleteMany({
        where: { companyId },
      });

      deletionResults.locations = await prisma.location.deleteMany({
        where: { companyId },
      });

      deletionResults.routes = await prisma.route.deleteMany({
        where: { companyId },
      });

      deletionResults.communications = await prisma.communication.deleteMany({
        where: { companyId },
      });

      deletionResults.onCallShifts = await prisma.onCallShift.deleteMany({
        where: { companyId },
      });

      // 9. Delete safety records
      deletionResults.meetingAttendance = await prisma.meetingAttendance.deleteMany({
        where: { meeting: { companyId } },
      });

      deletionResults.safetyMeetings = await prisma.safetyMeeting.deleteMany({
        where: { companyId },
      });

      deletionResults.safetyPolicies = await prisma.safetyPolicy.deleteMany({
        where: { companyId },
      });

      deletionResults.safetyCampaigns = await prisma.safetyCampaign.deleteMany({
        where: { companyId },
      });

      deletionResults.safetyIncidents = await prisma.safetyIncident.deleteMany({
        where: { companyId },
      });

      deletionResults.safetyTrainings = await prisma.safetyTraining.deleteMany({
        where: { companyId },
      });

      deletionResults.complianceAlerts = await prisma.complianceAlert.deleteMany({
        where: { companyId },
      });

      deletionResults.complianceReviews = await prisma.complianceReview.deleteMany({
        where: { companyId },
      });

      deletionResults.fmcsaCompliance = await prisma.fMCSACompliance.deleteMany({
        where: { companyId },
      });

      deletionResults.csaScores = await prisma.cSAScore.deleteMany({
        where: { companyId },
      });

      deletionResults.dataQSubmissions = await prisma.dataQSubmission.deleteMany({
        where: { companyId },
      });

      deletionResults.trainingMaterials = await prisma.trainingMaterial.deleteMany({
        where: { companyId },
      });

      // 10. Delete IFTA records
      deletionResults.iftaStateMileage = await prisma.iFTAStateMileage.deleteMany({
        where: { iftaEntry: { companyId } },
      });

      deletionResults.iftaEntries = await prisma.iFTAEntry.deleteMany({
        where: { companyId },
      });

      deletionResults.iftaConfigs = await prisma.iFTAConfig.deleteMany({
        where: { companyId },
      });

      // 11. Delete accounting-related records
      deletionResults.factoringBatches = await prisma.factoringBatch.deleteMany({
        where: { companyId },
      });

      deletionResults.factoringCompanies = await prisma.factoringCompany.deleteMany({
        where: { companyId },
      });

      // Note: rateConfirmations and accessorialCharges already deleted earlier (before loads due to FK constraints)

      // 12. Delete inventory records
      deletionResults.inventoryTransactions = await prisma.inventoryTransaction.deleteMany({
        where: { companyId },
      });

      deletionResults.inventoryItems = await prisma.inventoryItem.deleteMany({
        where: { companyId },
      });

      // 13. Delete configuration records (but keep company structure)
      deletionResults.deductionRules = await prisma.deductionRule.deleteMany({
        where: { companyId },
      });

      deletionResults.paymentConfigurations = await prisma.paymentConfiguration.deleteMany({
        where: { companyId },
      });

      deletionResults.orderPaymentTypes = await prisma.orderPaymentType.deleteMany({
        where: { companyId },
      });

      deletionResults.dynamicStatuses = await prisma.dynamicStatus.deleteMany({
        where: { companyId },
      });

      deletionResults.documentTemplates = await prisma.documentTemplate.deleteMany({
        where: { companyId },
      });

      deletionResults.defaultConfigurations = await prisma.defaultConfiguration.deleteMany({
        where: { companyId },
      });

      deletionResults.expenseTypes = await prisma.expenseType.deleteMany({
        where: { companyId },
      });

      deletionResults.expenseCategories = await prisma.expenseCategory.deleteMany({
        where: { companyId },
      });

      deletionResults.tariffs = await prisma.tariff.deleteMany({
        where: { companyId },
      });

      deletionResults.tariffRules = await prisma.tariffRule.deleteMany({
        where: { companyId },
      });

      deletionResults.tags = await prisma.tag.deleteMany({
        where: { companyId },
      });

      deletionResults.integrations = await prisma.integration.deleteMany({
        where: { companyId },
      });

      // 14. Delete user-company associations (but keep users and companies)
      deletionResults.userCompanies = await prisma.userCompany.deleteMany({
        where: { companyId },
      });

      // 15. Delete users (but this might break things, so we'll keep them for now)
      // Actually, let's delete non-admin users only to be safe
      deletionResults.users = await prisma.user.deleteMany({
        where: {
          companyId,
          role: { not: 'ADMIN' },
        },
      });

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

