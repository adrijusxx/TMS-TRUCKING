'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';

/**
 * Universal server action to perform bulk delete operations
 * Only accessible by ADMIN users
 * 
 * @param entityType - The type of entity to delete (e.g., 'driver', 'load', 'invoice')
 * @param ids - Array of entity IDs to delete
 * @returns Success/error result
 */
export async function bulkDeleteEntities(
  entityType: string,
  ids: string[]
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user?.companyId) {
      return {
        success: false,
        error: 'Unauthorized: Not authenticated',
      };
    }

    // 2. Security check - Only Admins can perform bulk delete
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Forbidden: Only Administrators can perform bulk delete operations',
      };
    }

    // 3. Validate inputs
    if (!entityType || !ids || ids.length === 0) {
      return {
        success: false,
        error: 'Invalid input: entityType and ids array are required',
      };
    }

    // 4. Normalize entity type to lowercase
    const normalizedType = entityType.toLowerCase().trim();

    // 5. Perform bulk delete based on entity type
    let deletedCount = 0;

    switch (normalizedType) {
      case 'driver':
      case 'drivers': {
        const result = await prisma.driver.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'load':
      case 'loads': {
        const result = await prisma.load.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'invoice':
      case 'invoices': {
        const result = await prisma.invoice.deleteMany({
          where: {
            id: { in: ids },
            customer: {
              companyId: session.user.companyId,
            },
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'truck':
      case 'trucks': {
        const result = await prisma.truck.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'trailer':
      case 'trailers': {
        const result = await prisma.trailer.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'customer':
      case 'customers': {
        const result = await prisma.customer.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'vendor':
      case 'vendors': {
        const result = await prisma.vendor.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'user':
      case 'users': {
        const result = await prisma.user.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'document':
      case 'documents': {
        const result = await prisma.document.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'location':
      case 'locations': {
        const result = await prisma.location.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'inspection':
      case 'inspections': {
        const result = await prisma.inspection.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'breakdown':
      case 'breakdowns': {
        const result = await prisma.breakdown.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'settlement':
      case 'settlements': {
        const result = await prisma.settlement.deleteMany({
          where: {
            id: { in: ids },
            driver: {
              companyId: session.user.companyId,
            },
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'batch':
      case 'batches': {
        const result = await prisma.invoiceBatch.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'expense':
      case 'expenses':
      case 'load-expense':
      case 'load-expenses': {
        const result = await prisma.loadExpense.deleteMany({
          where: {
            id: { in: ids },
            load: {
              companyId: session.user.companyId,
            },
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'accessorial':
      case 'accessorials':
      case 'accessorial-charge':
      case 'accessorial-charges': {
        const result = await prisma.accessorialCharge.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'rate-confirmation':
      case 'rate-confirmations': {
        const result = await prisma.rateConfirmation.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'factoring-company':
      case 'factoring-companies': {
        const result = await prisma.factoringCompany.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      case 'maintenance':
      case 'maintenance-record':
      case 'maintenance-records': {
        const result = await prisma.maintenanceRecord.deleteMany({
          where: {
            id: { in: ids },
            companyId: session.user.companyId,
          },
        });
        deletedCount = result.count;
        break;
      }

      default: {
        return {
          success: false,
          error: `Unsupported entity type: ${entityType}. Supported types: driver, load, invoice, truck, trailer, customer, vendor, user, document, location, inspection, breakdown, settlement, batch, expense, accessorial, rate-confirmation, factoring-company, maintenance`,
        };
      }
    }

    // 6. Revalidate dashboard page to refresh data
    revalidatePath('/dashboard');

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error('Error in bulkDeleteEntities:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete entities',
    };
  }
}




