import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';
import { z } from 'zod';

const bulkActionSchema = z.object({
  entityType: z.string(), // Accept any string, we'll validate and map it
  action: z.enum(['update', 'delete', 'status', 'assign', 'archive', 'export']),
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
  updates: z.record(z.string(), z.any()).optional(),
  status: z.string().optional(),
  hardDelete: z.boolean().optional(), // If true, permanently delete instead of soft delete
});

// Map plural entity types to singular Prisma model names
const entityTypeMap: Record<string, string> = {
  loads: 'load',
  trucks: 'truck',
  drivers: 'driver',
  customers: 'customer',
  invoices: 'invoice',
  users: 'user',
  trailers: 'trailer',
  inspections: 'inspection',
  breakdowns: 'breakdown',
  documents: 'document',
  settlements: 'settlement',
  batches: 'batch',
  vendors: 'vendor',
  locations: 'location',
  maintenance: 'maintenance',
  'rate-confirmations': 'rateConfirmation',
  'factoring-companies': 'factoringCompany',
  expenses: 'loadExpense',
  'load-expenses': 'loadExpense',
  'accessorial-charges': 'accessorialCharge',
  accessorials: 'accessorialCharge',
  // Also support singular forms
  load: 'load',
  truck: 'truck',
  driver: 'driver',
  customer: 'customer',
  invoice: 'invoice',
  user: 'user',
  trailer: 'trailer',
  inspection: 'inspection',
  breakdown: 'breakdown',
  document: 'document',
  settlement: 'settlement',
  batch: 'batch',
  vendor: 'vendor',
  location: 'location',
  expense: 'loadExpense',
  'load-expense': 'loadExpense',
  'accessorial-charge': 'accessorialCharge',
  accessorial: 'accessorialCharge',
};

/**
 * POST /api/bulk-actions
 * Perform bulk actions on multiple entities
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    const validated = bulkActionSchema.parse(body);

    // Map entity type to singular Prisma model name
    const modelName = entityTypeMap[validated.entityType];
    if (!modelName) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ENTITY', message: `Invalid entity type: ${validated.entityType}` },
        },
        { status: 400 }
      );
    }

    // Map entity types to Prisma models and permission checks
    // Note: model names here are internal identifiers, actual Prisma model names are handled in delete logic
    const entityConfig: Record<string, { model: string; permission: string }> = {
      load: { model: 'load', permission: 'loads.edit' },
      truck: { model: 'truck', permission: 'trucks.edit' },
      driver: { model: 'driver', permission: 'drivers.edit' },
      customer: { model: 'customer', permission: 'customers.edit' },
      invoice: { model: 'invoice', permission: 'invoices.edit' },
      user: { model: 'user', permission: 'users.edit' },
      trailer: { model: 'trailer', permission: 'trailers.edit' },
      inspection: { model: 'inspection', permission: 'inspections.edit' },
      breakdown: { model: 'breakdown', permission: 'breakdowns.edit' },
      document: { model: 'document', permission: 'documents.delete' },
      settlement: { model: 'settlement', permission: 'settlements.edit' },
      batch: { model: 'batch', permission: 'batches.edit' }, // Prisma: invoiceBatch
      vendor: { model: 'vendor', permission: 'vendors.edit' },
      location: { model: 'location', permission: 'locations.edit' },
      maintenance: { model: 'maintenance', permission: 'maintenance.edit' }, // Prisma: maintenanceRecord
      rateConfirmation: { model: 'rateConfirmation', permission: 'rate_confirmations.edit' },
      factoringCompany: { model: 'factoringCompany', permission: 'factoring_companies.edit' },
      loadExpense: { model: 'loadExpense', permission: 'loads.edit' },
      accessorialCharge: { model: 'accessorialCharge', permission: 'loads.edit' },
    };

    const config = entityConfig[modelName];
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ENTITY', message: `Entity type not supported: ${validated.entityType}` },
        },
        { status: 400 }
      );
    }

    // Check permissions
    let permissionToCheck = config.permission;
    
    // For delete action, check delete permission
    if (validated.action === 'delete') {
      if (modelName === 'user') {
        permissionToCheck = 'users.delete';
      } else {
        // Extract entity name from permission (e.g., 'loads.edit' -> 'loads.delete')
        const entityName = config.permission.split('.')[0];
        permissionToCheck = `${entityName}.delete` as any;
      }
    }
    
    if (!hasPermission(session.user.role, permissionToCheck as any)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    let result: any;

    // Handle delete action
    if (validated.action === 'delete') {
      const model = config.model;
      
      // Handle Invoice delete
      if (model === 'invoice') {
        const hardDelete = validated.hardDelete === true && session.user.role === 'ADMIN';
        
        // Build base where clause - start with company filter only
        const baseWhereClause: any = {
          id: { in: validated.ids },
          customer: {
            companyId: session.user.companyId,
          },
        };
        
        // Try to add MC filter for invoices (uses mcNumber string field)
        // Make this optional - if it fails, we'll skip MC filtering
        try {
          const mcWhere = await buildMcNumberWhereClause(session, request);
          const invoiceMcWhere = await convertMcNumberIdToMcNumberString(mcWhere);
          
          // Add MC filter if applicable and valid
          if (invoiceMcWhere?.mcNumber) {
            baseWhereClause.mcNumber = invoiceMcWhere.mcNumber;
          }
        } catch (mcError) {
          // Log but don't fail - MC filtering is optional for security
          console.warn('MC number filter failed for invoice deletion, continuing without MC filter:', mcError);
        }
        
        if (hardDelete) {
          // HARD DELETE: Permanently remove (admin only, bypasses status checks)
          result = await prisma.invoice.deleteMany({
            where: baseWhereClause,
          });

          return NextResponse.json({
            success: true,
            data: {
              deleted: result.count,
              message: `Permanently deleted ${result.count} invoice(s) from the system (including PAID/POSTED invoices)`,
            },
          });
        }
        
        // SOFT DELETE: Mark as CANCELLED (respects status restrictions)
        // Get all selected invoices to check their status
        const allInvoices = await prisma.invoice.findMany({
          where: baseWhereClause,
          select: { id: true, status: true, invoiceNumber: true },
        });
        
        // Check if any invoices were found
        if (allInvoices.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_VALID_RECORDS',
                message: `No invoices found matching the selected IDs. They may not exist or you may not have permission to access them.`,
              },
            },
            { status: 400 }
          );
        }
        
        // Separate deletable vs non-deletable
        const deletableInvoices = allInvoices.filter(i => !['PAID', 'POSTED'].includes(i.status));
        const nonDeletableInvoices = allInvoices.filter(i => ['PAID', 'POSTED'].includes(i.status));
        
        if (deletableInvoices.length === 0) {
          const reasons = nonDeletableInvoices.length > 0
            ? `All ${nonDeletableInvoices.length} selected invoice(s) are PAID or POSTED and cannot be cancelled. Financial records must be preserved for accounting compliance. Use hard delete to permanently remove them.`
            : 'No valid invoices found in your selection.';
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_VALID_RECORDS',
                message: reasons,
              },
            },
            { status: 400 }
          );
        }
        
        // Soft delete by marking as CANCELLED
        result = await prisma.invoice.updateMany({
          where: {
            id: { in: deletableInvoices.map(i => i.id) },
          },
          data: {
            status: 'CANCELLED',
          },
        });

        const message = nonDeletableInvoices.length > 0
          ? `Cancelled ${result.count} invoice(s). ${nonDeletableInvoices.length} invoice(s) could not be cancelled (PAID/POSTED).`
          : `Successfully cancelled ${result.count} invoice(s)`;

        return NextResponse.json({
          success: true,
          data: {
            deleted: result.count,
            skipped: nonDeletableInvoices.length,
            message,
          },
        });
      }
      
      // Handle Settlement delete
      if (model === 'settlement') {
        const hardDelete = validated.hardDelete === true && session.user.role === 'ADMIN';
        
        // Build MC filter (settlements linked through drivers with mcNumberId)
        const mcWhere = await buildMcNumberWhereClause(session, request);
        
        // Build base where clause with company filter
        const driverWhere: any = {
          companyId: session.user.companyId,
        };
        
        // Add MC filter if applicable (settlements through driver.mcNumberId)
        if (mcWhere.mcNumberId) {
          driverWhere.mcNumberId = mcWhere.mcNumberId;
        }
        
        // Build where clause for settlements
        const settlementWhere: any = {
          id: { in: validated.ids },
          driver: driverWhere,
        };
        
        if (hardDelete) {
          // HARD DELETE: Permanently remove (admin only, bypasses status checks)
          result = await prisma.settlement.deleteMany({
            where: settlementWhere,
          });

          return NextResponse.json({
            success: true,
            data: {
              deleted: result.count,
              message: `Permanently deleted ${result.count} settlement(s) from the system (including non-PENDING settlements)`,
            },
          });
        }
        
        // SOFT DELETE: Only PENDING settlements can be deleted (default behavior)
        // Get all selected settlements to check their status
        const allSettlements = await prisma.settlement.findMany({
          where: settlementWhere,
          select: { id: true, status: true, settlementNumber: true },
        });
        
        // Separate deletable vs non-deletable
        const deletableSettlements = allSettlements.filter(s => s.status === 'PENDING');
        const nonDeletableSettlements = allSettlements.filter(s => s.status !== 'PENDING');
        
        if (deletableSettlements.length === 0) {
          const statusCounts = nonDeletableSettlements.reduce((acc: Record<string, number>, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
          }, {});
          const statusInfo = Object.entries(statusCounts).map(([status, count]) => `${count} ${status}`).join(', ');
          
          const reasons = nonDeletableSettlements.length > 0
            ? `Cannot delete settlements: ${statusInfo}. Only PENDING settlements can be deleted. Use hard delete to permanently remove all settlements.`
            : 'No valid settlements found in your selection.';
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_VALID_RECORDS',
                message: reasons,
              },
            },
            { status: 400 }
          );
        }
        
        // Hard delete pending settlements (since they haven't been approved/paid yet)
        result = await prisma.settlement.deleteMany({
          where: {
            id: { in: deletableSettlements.map(s => s.id) },
          },
        });

        const message = nonDeletableSettlements.length > 0
          ? `Deleted ${result.count} settlement(s). ${nonDeletableSettlements.length} settlement(s) could not be deleted (not PENDING).`
          : `Successfully deleted ${result.count} settlement(s)`;

        return NextResponse.json({
          success: true,
          data: {
            deleted: result.count,
            skipped: nonDeletableSettlements.length,
            message,
          },
        });
      }
      
      // Models without deletedAt field - use hard delete
      // These include: loadExpense, accessorialCharge, invoiceBatch (batch), 
      // maintenanceRecord (maintenance), factoringCompany, rateConfirmation
      const modelsWithoutDeletedAt = [
        'loadExpense', 
        'accessorialCharge', 
        'batch', // InvoiceBatch
        'maintenance', // MaintenanceRecord
        'factoringCompany',
        'rateConfirmation',
      ];
      
      if (modelsWithoutDeletedAt.includes(model)) {
        // Map model names to actual Prisma model names
        const prismaModelMap: Record<string, string> = {
          batch: 'invoiceBatch',
          maintenance: 'maintenanceRecord',
          factoringCompany: 'factoringCompany',
          rateConfirmation: 'rateConfirmation',
          loadExpense: 'loadExpense',
          accessorialCharge: 'accessorialCharge',
        };
        
        const actualModel = prismaModelMap[model] || model;
        
        // Build where clause
        let whereClause: any = {
          id: { in: validated.ids },
        };
        
        // Handle models with companyId
        if (['invoiceBatch', 'maintenanceRecord', 'factoringCompany', 'rateConfirmation', 'accessorialCharge'].includes(actualModel)) {
          whereClause.companyId = session.user.companyId;
        } else if (actualModel === 'loadExpense') {
          // LoadExpense is linked through Load
          const expenses = await prisma.loadExpense.findMany({
            where: {
              id: { in: validated.ids },
              load: {
                companyId: session.user.companyId,
                deletedAt: null,
              },
            },
            select: { id: true },
          });
          
          if (expenses.length === 0) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NO_VALID_RECORDS',
                  message: 'No valid expenses found to delete',
                },
              },
              { status: 400 }
            );
          }
          
          whereClause = { id: { in: expenses.map(e => e.id) } };
        }
        
        // Hard delete
        result = await (prisma[actualModel as keyof typeof prisma] as any).deleteMany({
          where: whereClause,
        });

        return NextResponse.json({
          success: true,
          data: {
            deleted: result.count,
            message: `Successfully deleted ${result.count} ${validated.entityType}(s)`,
          },
        });
      }
      
      // Check if hard delete is requested (admin only, for data management)
      const hardDelete = validated.hardDelete === true && session.user.role === 'ADMIN';
      
      if (hardDelete) {
        // HARD DELETE: Permanently remove from database
        // Build where clause - include soft-deleted records too
        const whereClause: any = {
          id: { in: validated.ids },
          // Don't filter by deletedAt - we want to delete even soft-deleted records
        };
        
        // For users, use MC-based filtering instead of companyId
        if (model === 'user') {
          const mcAccess = (session.user as any)?.mcAccess || [];
          const isAdmin = (session.user as any)?.role === 'ADMIN';
          
          if (!isAdmin && mcAccess.length > 0) {
            whereClause.mcNumberId = { in: mcAccess };
          } else if (!isAdmin) {
            whereClause.id = { in: [] }; // No access
          }
        } else {
          // For other models, use companyId filtering
          whereClause.companyId = session.user.companyId;
        }
        
        // Hard delete - permanently remove
        result = await (prisma[model as keyof typeof prisma] as any).deleteMany({
          where: whereClause,
        });

        return NextResponse.json({
          success: true,
          data: {
            deleted: result.count,
            message: `Permanently deleted ${result.count} ${validated.entityType}(s) from the system`,
          },
        });
      }
      
      // SOFT DELETE: Mark as deleted (default behavior)
      // For users, also set isActive to false
      const deleteData: any = {
        deletedAt: new Date(),
      };
      if (model === 'user') {
        deleteData.isActive = false;
      }
      
      // Build where clause for models with deletedAt (soft delete)
      const whereClause: any = {
        id: { in: validated.ids },
        deletedAt: null, // Only soft-delete records that aren't already deleted
      };
      
      // For users, use MC-based filtering instead of companyId
      if (model === 'user') {
        // Get MC access for filtering
        const mcAccess = (session.user as any)?.mcAccess || [];
        const isAdmin = (session.user as any)?.role === 'ADMIN';
        
        if (!isAdmin && mcAccess.length > 0) {
          // Non-admin users can only delete users in their MC access
          whereClause.mcNumberId = { in: mcAccess };
        } else if (!isAdmin) {
          // No MC access, can't delete anyone
          whereClause.id = { in: [] }; // This will match no records
        }
        // Admin users can delete any user (no additional filtering)
      } else {
        // For other models, use companyId filtering
        whereClause.companyId = session.user.companyId;
      }
      
      // Use companyId filtering for security (soft delete)
      result = await (prisma[model as keyof typeof prisma] as any).updateMany({
        where: whereClause,
        data: deleteData,
      });

      return NextResponse.json({
        success: true,
        data: {
          deleted: result.count,
          message: `Successfully deleted ${result.count} ${validated.entityType}(s)`,
        },
      });
    }

    // Handle status update
    if (validated.action === 'status' && validated.status) {
      const updateData: any = { status: validated.status };
      const model = config.model;
      
      // Models without deletedAt field
      const modelsWithoutDeletedAt = [
        'settlement', 'invoice', 'loadExpense', 'accessorialCharge',
        'batch', 'maintenance', 'factoringCompany', 'rateConfirmation',
      ];
      
      // Map internal model names to Prisma model names
      const prismaModelMap: Record<string, string> = {
        batch: 'invoiceBatch',
        maintenance: 'maintenanceRecord',
      };
      const actualModel = prismaModelMap[model] || model;
      
      // Build where clause based on model structure
      const whereClause: any = {
        id: { in: validated.ids },
      };
      
      // Add deletedAt filter only for models that have it
      if (!modelsWithoutDeletedAt.includes(model)) {
        whereClause.deletedAt = null;
      }
      
      // Models with companyId or linked through relations
      if (model === 'accessorialCharge' || model === 'batch' || model === 'maintenance' || 
          model === 'factoringCompany' || model === 'rateConfirmation') {
        whereClause.companyId = session.user.companyId;
      } else if (model === 'loadExpense') {
        // LoadExpense is linked through Load, filter by Load's companyId
        const expenses = await prisma.loadExpense.findMany({
          where: {
            id: { in: validated.ids },
            load: {
              companyId: session.user.companyId,
              deletedAt: null,
            },
          },
          select: { id: true },
        });
        
        if (expenses.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NO_VALID_RECORDS', message: 'No valid expenses found to update' },
            },
            { status: 400 }
          );
        }
        
        whereClause.id = { in: expenses.map(e => e.id) };
      } else if (model === 'invoice') {
        // Invoice is linked through Customer, filter by Customer's companyId
        const invoices = await prisma.invoice.findMany({
          where: {
            id: { in: validated.ids },
            customer: { companyId: session.user.companyId },
          },
          select: { id: true },
        });
        
        if (invoices.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NO_VALID_RECORDS', message: 'No valid invoices found to update' },
            },
            { status: 400 }
          );
        }
        
        whereClause.id = { in: invoices.map(i => i.id) };
      } else if (model === 'settlement') {
        // Settlement is linked through Driver, filter by Driver's companyId
        const settlements = await prisma.settlement.findMany({
          where: {
            id: { in: validated.ids },
            driver: { companyId: session.user.companyId },
          },
          select: { id: true },
        });
        
        if (settlements.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NO_VALID_RECORDS', message: 'No valid settlements found to update' },
            },
            { status: 400 }
          );
        }
        
        whereClause.id = { in: settlements.map(s => s.id) };
      } else {
        whereClause.companyId = session.user.companyId;
      }
      
      result = await (prisma[actualModel as keyof typeof prisma] as any).updateMany({
        where: whereClause,
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: {
          updated: result.count,
          message: `Successfully updated status for ${result.count} ${validated.entityType}(s)`,
        },
      });
    }

    // Handle general update
    if (validated.action === 'update' && validated.updates) {
      // Validate and sanitize updates based on entity type
      const updateData: any = { ...validated.updates };
      
      // Remove fields that shouldn't be bulk updated
      delete updateData.id;
      delete updateData.companyId;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const model = config.model;
      
      // Models without deletedAt field
      const modelsWithoutDeletedAt = [
        'settlement', 'invoice', 'loadExpense', 'accessorialCharge',
        'batch', 'maintenance', 'factoringCompany', 'rateConfirmation',
      ];
      
      // Map internal model names to Prisma model names
      const prismaModelMap: Record<string, string> = {
        batch: 'invoiceBatch',
        maintenance: 'maintenanceRecord',
      };
      const actualModel = prismaModelMap[model] || model;
      
      // Build where clause based on model structure
      const whereClause: any = {
        id: { in: validated.ids },
      };
      
      // Add deletedAt filter only for models that have it
      if (!modelsWithoutDeletedAt.includes(model)) {
        whereClause.deletedAt = null;
      }
      
      // Models with companyId or linked through relations
      if (model === 'accessorialCharge' || model === 'batch' || model === 'maintenance' || 
          model === 'factoringCompany' || model === 'rateConfirmation') {
        whereClause.companyId = session.user.companyId;
      } else if (model === 'loadExpense') {
        // LoadExpense is linked through Load
        const expenses = await prisma.loadExpense.findMany({
          where: {
            id: { in: validated.ids },
            load: { companyId: session.user.companyId, deletedAt: null },
          },
          select: { id: true },
        });
        
        if (expenses.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NO_VALID_RECORDS', message: 'No valid expenses found to update' },
            },
            { status: 400 }
          );
        }
        
        whereClause.id = { in: expenses.map(e => e.id) };
      } else if (model === 'invoice') {
        // Invoice is linked through Customer
        const invoices = await prisma.invoice.findMany({
          where: {
            id: { in: validated.ids },
            customer: { companyId: session.user.companyId },
          },
          select: { id: true },
        });
        
        if (invoices.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NO_VALID_RECORDS', message: 'No valid invoices found to update' },
            },
            { status: 400 }
          );
        }
        
        whereClause.id = { in: invoices.map(i => i.id) };
      } else if (model === 'settlement') {
        // Settlement is linked through Driver
        const settlements = await prisma.settlement.findMany({
          where: {
            id: { in: validated.ids },
            driver: { companyId: session.user.companyId },
          },
          select: { id: true },
        });
        
        if (settlements.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NO_VALID_RECORDS', message: 'No valid settlements found to update' },
            },
            { status: 400 }
          );
        }
        
        whereClause.id = { in: settlements.map(s => s.id) };
      } else {
        whereClause.companyId = session.user.companyId;
      }
      
      result = await (prisma[actualModel as keyof typeof prisma] as any).updateMany({
        where: whereClause,
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: {
          updated: result.count,
          message: `Successfully updated ${result.count} ${validated.entityType}(s)`,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Invalid action or missing required data' },
      },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Bulk action validation error:', error.issues);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Bulk action error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to perform bulk action',
        },
      },
      { status: 500 }
    );
  }
}

