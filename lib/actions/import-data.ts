'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';

/**
 * Universal server action to import bulk data
 * Only accessible by ADMIN users
 * 
 * @param entityType - The type of entity to import (e.g., 'driver', 'load', 'invoice')
 * @param data - Array of already-mapped data objects ready for database insertion
 * @returns Success/error result with count of created records
 */
export async function importBulkData(
  entityType: string,
  data: any[]
): Promise<{ success: boolean; created?: number; error?: string }> {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user?.companyId) {
      return {
        success: false,
        error: 'Unauthorized: Not authenticated',
      };
    }

    // 2. Security check - Only Admins can perform bulk import
    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: 'Forbidden: Only Administrators can perform bulk import operations',
      };
    }

    // 3. Validate inputs
    if (!entityType || !data || data.length === 0) {
      return {
        success: false,
        error: 'Invalid input: entityType and data array are required',
      };
    }

    // 4. Normalize entity type to lowercase
    const normalizedType = entityType.toLowerCase().trim();

    // 5. Add companyId to all records
    const dataWithCompany = data.map((record) => ({
      ...record,
      companyId: session.user.companyId,
    }));

    // 6. Perform bulk import based on entity type
    let createdCount = 0;

    switch (normalizedType) {
      case 'driver':
      case 'drivers': {
        const result = await prisma.driver.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'load':
      case 'loads': {
        const result = await prisma.load.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'invoice':
      case 'invoices': {
        const result = await prisma.invoice.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'truck':
      case 'trucks': {
        const result = await prisma.truck.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'trailer':
      case 'trailers': {
        const result = await prisma.trailer.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'customer':
      case 'customers': {
        const result = await prisma.customer.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'vendor':
      case 'vendors': {
        const result = await prisma.vendor.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'document':
      case 'documents': {
        const result = await prisma.document.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'location':
      case 'locations': {
        const result = await prisma.location.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'inspection':
      case 'inspections': {
        const result = await prisma.inspection.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'breakdown':
      case 'breakdowns': {
        const result = await prisma.breakdown.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'settlement':
      case 'settlements': {
        const result = await prisma.settlement.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'batch':
      case 'batches': {
        const result = await prisma.invoiceBatch.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'expense':
      case 'expenses':
      case 'load-expense':
      case 'load-expenses': {
        const result = await prisma.loadExpense.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'accessorial':
      case 'accessorials':
      case 'accessorial-charge':
      case 'accessorial-charges': {
        const result = await prisma.accessorialCharge.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'rate-confirmation':
      case 'rate-confirmations': {
        const result = await prisma.rateConfirmation.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'factoring-company':
      case 'factoring-companies': {
        const result = await prisma.factoringCompany.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      case 'maintenance':
      case 'maintenance-record':
      case 'maintenance-records': {
        const result = await prisma.maintenanceRecord.createMany({
          data: dataWithCompany as any,
          skipDuplicates: true,
        });
        createdCount = result.count;
        break;
      }

      default: {
        return {
          success: false,
          error: `Unsupported entity type: ${entityType}. Supported types: driver, load, invoice, truck, trailer, customer, vendor, document, location, inspection, breakdown, settlement, batch, expense, accessorial, rate-confirmation, factoring-company, maintenance`,
        };
      }
    }

    // 7. Revalidate dashboard page to refresh data
    revalidatePath('/dashboard');

    return {
      success: true,
      created: createdCount,
    };
  } catch (error) {
    console.error('Error in importBulkData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import data',
    };
  }
}





























