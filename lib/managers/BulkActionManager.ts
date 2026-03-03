import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';
import { logger } from '@/lib/utils/logger';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BulkActionInput {
  entityType: string;
  action: 'update' | 'delete' | 'status' | 'assign' | 'archive' | 'export';
  ids: string[];
  updates?: Record<string, any>;
  status?: string;
  hardDelete?: boolean;
}

interface SessionUser {
  companyId: string;
  role: string;
  id: string;
  mcAccess?: string[];
}

interface BulkActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: { code: string; message: string };
  statusCode?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Map plural entity types to singular Prisma model names */
export const entityTypeMap: Record<string, string> = {
  loads: 'load', trucks: 'truck', drivers: 'driver', customers: 'customer',
  invoices: 'invoice', users: 'user', trailers: 'trailer', inspections: 'inspection',
  breakdowns: 'breakdown', documents: 'document', settlements: 'settlement',
  batches: 'batch', vendors: 'vendor', locations: 'location', maintenance: 'maintenance',
  'rate-confirmations': 'rateConfirmation', 'factoring-companies': 'factoringCompany',
  expenses: 'loadExpense', 'load-expenses': 'loadExpense',
  'accessorial-charges': 'accessorialCharge', accessorials: 'accessorialCharge',
  // Singular forms
  load: 'load', truck: 'truck', driver: 'driver', customer: 'customer',
  invoice: 'invoice', user: 'user', trailer: 'trailer', inspection: 'inspection',
  breakdown: 'breakdown', document: 'document', settlement: 'settlement',
  batch: 'batch', vendor: 'vendor', location: 'location',
  expense: 'loadExpense', 'load-expense': 'loadExpense',
  'accessorial-charge': 'accessorialCharge', accessorial: 'accessorialCharge',
};

/** Entity permission configuration */
export const entityConfig: Record<string, { model: string; permission: string }> = {
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
  batch: { model: 'batch', permission: 'batches.edit' },
  vendor: { model: 'vendor', permission: 'vendors.edit' },
  location: { model: 'location', permission: 'locations.edit' },
  maintenance: { model: 'maintenance', permission: 'maintenance.edit' },
  rateConfirmation: { model: 'rateConfirmation', permission: 'rate_confirmations.edit' },
  factoringCompany: { model: 'factoringCompany', permission: 'factoring_companies.edit' },
  loadExpense: { model: 'loadExpense', permission: 'loads.edit' },
  accessorialCharge: { model: 'accessorialCharge', permission: 'loads.edit' },
};

const MODELS_WITHOUT_DELETED_AT = [
  'loadExpense', 'accessorialCharge', 'batch', 'maintenance',
  'factoringCompany', 'rateConfirmation',
];

const PRISMA_MODEL_MAP: Record<string, string> = {
  batch: 'invoiceBatch',
  maintenance: 'maintenanceRecord',
};

const MODELS_NEEDING_STATUS_FILTER = [
  'settlement', 'invoice', 'loadExpense', 'accessorialCharge',
  'batch', 'maintenance', 'factoringCompany', 'rateConfirmation',
];

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/**
 * BulkActionManager - handles bulk delete, status update, and general update
 * operations across all entity types. Extracted from the bulk-actions route.
 */
export class BulkActionManager {

  // ---- Delete Handlers ----

  static async handleDelete(
    input: BulkActionInput,
    user: SessionUser,
    session: any,
    request: NextRequest,
  ): Promise<BulkActionResult> {
    const modelName = entityTypeMap[input.entityType];
    const config = entityConfig[modelName];
    const model = config.model;

    if (model === 'invoice') return this.deleteInvoices(input, user, session, request);
    if (model === 'settlement') return this.deleteSettlements(input, user, session, request);
    if (MODELS_WITHOUT_DELETED_AT.includes(model)) return this.deleteHardModels(input, user, model);
    return this.deleteSoftModels(input, user, model);
  }

  private static async deleteInvoices(
    input: BulkActionInput, user: SessionUser, session: any, request: NextRequest,
  ): Promise<BulkActionResult> {
    const hardDelete = input.hardDelete === true && user.role === 'ADMIN';

    const baseWhere: any = {
      id: { in: input.ids },
      customer: { companyId: user.companyId },
    };

    try {
      const mcWhere = await buildMcNumberWhereClause(session, request);
      const invoiceMcWhere = await convertMcNumberIdToMcNumberString(mcWhere);
      if (invoiceMcWhere?.mcNumber) baseWhere.mcNumber = invoiceMcWhere.mcNumber;
    } catch (mcError) {
      logger.warn('MC number filter failed for invoice deletion, continuing without MC filter');
    }

    if (hardDelete) {
      const result = await prisma.invoice.deleteMany({ where: baseWhere });
      return {
        success: true,
        data: {
          deleted: result.count,
          message: `Permanently deleted ${result.count} invoice(s) from the system (including PAID/POSTED invoices)`,
        },
      };
    }

    const allInvoices = await prisma.invoice.findMany({
      where: baseWhere,
      select: { id: true, status: true, invoiceNumber: true },
    });

    if (allInvoices.length === 0) {
      return { success: false, error: { code: 'NO_VALID_RECORDS', message: 'No invoices found matching the selected IDs.' }, statusCode: 400 };
    }

    const deletable = allInvoices.filter(i => !['PAID', 'POSTED'].includes(i.status));
    const nonDeletable = allInvoices.filter(i => ['PAID', 'POSTED'].includes(i.status));

    if (deletable.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_VALID_RECORDS',
          message: `All ${nonDeletable.length} selected invoice(s) are PAID or POSTED and cannot be cancelled. Use hard delete to permanently remove them.`,
        },
        statusCode: 400,
      };
    }

    const result = await prisma.invoice.updateMany({
      where: { id: { in: deletable.map(i => i.id) } },
      data: { status: 'CANCELLED' },
    });

    const message = nonDeletable.length > 0
      ? `Cancelled ${result.count} invoice(s). ${nonDeletable.length} invoice(s) could not be cancelled (PAID/POSTED).`
      : `Successfully cancelled ${result.count} invoice(s)`;

    return { success: true, data: { deleted: result.count, skipped: nonDeletable.length, message } };
  }

  private static async deleteSettlements(
    input: BulkActionInput, user: SessionUser, session: any, request: NextRequest,
  ): Promise<BulkActionResult> {
    const hardDelete = input.hardDelete === true && user.role === 'ADMIN';
    const mcWhere = await buildMcNumberWhereClause(session, request);

    const driverWhere: any = { companyId: user.companyId };
    if (mcWhere.mcNumberId) driverWhere.mcNumberId = mcWhere.mcNumberId;

    const settlementWhere: any = { id: { in: input.ids }, driver: driverWhere };

    if (hardDelete) {
      const result = await prisma.settlement.deleteMany({ where: settlementWhere });
      return {
        success: true,
        data: { deleted: result.count, message: `Permanently deleted ${result.count} settlement(s)` },
      };
    }

    const all = await prisma.settlement.findMany({
      where: settlementWhere,
      select: { id: true, status: true, settlementNumber: true },
    });

    const deletable = all.filter(s => s.status === 'PENDING');
    const nonDeletable = all.filter(s => s.status !== 'PENDING');

    if (deletable.length === 0) {
      const counts = nonDeletable.reduce((a: Record<string, number>, s) => {
        a[s.status] = (a[s.status] || 0) + 1; return a;
      }, {});
      const info = Object.entries(counts).map(([s, c]) => `${c} ${s}`).join(', ');
      return {
        success: false,
        error: { code: 'NO_VALID_RECORDS', message: `Cannot delete settlements: ${info}. Only PENDING settlements can be deleted.` },
        statusCode: 400,
      };
    }

    const result = await prisma.settlement.deleteMany({
      where: { id: { in: deletable.map(s => s.id) } },
    });

    const message = nonDeletable.length > 0
      ? `Deleted ${result.count} settlement(s). ${nonDeletable.length} could not be deleted (not PENDING).`
      : `Successfully deleted ${result.count} settlement(s)`;

    return { success: true, data: { deleted: result.count, skipped: nonDeletable.length, message } };
  }

  private static async deleteHardModels(
    input: BulkActionInput, user: SessionUser, model: string,
  ): Promise<BulkActionResult> {
    const actualModel = PRISMA_MODEL_MAP[model] || model;
    let whereClause: any = { id: { in: input.ids } };

    const modelsWithCompanyId = ['invoiceBatch', 'maintenanceRecord', 'factoringCompany', 'rateConfirmation', 'accessorialCharge'];
    if (modelsWithCompanyId.includes(actualModel)) {
      whereClause.companyId = user.companyId;
    } else if (actualModel === 'loadExpense') {
      const expenses = await prisma.loadExpense.findMany({
        where: { id: { in: input.ids }, load: { companyId: user.companyId, deletedAt: null } },
        select: { id: true },
      });
      if (expenses.length === 0) {
        return { success: false, error: { code: 'NO_VALID_RECORDS', message: 'No valid expenses found to delete' }, statusCode: 400 };
      }
      whereClause = { id: { in: expenses.map(e => e.id) } };
    }

    const result = await (prisma[actualModel as keyof typeof prisma] as any).deleteMany({ where: whereClause });
    return {
      success: true,
      data: { deleted: result.count, message: `Successfully deleted ${result.count} ${input.entityType}(s)` },
    };
  }

  private static async deleteSoftModels(
    input: BulkActionInput, user: SessionUser, model: string,
  ): Promise<BulkActionResult> {
    const hardDelete = input.hardDelete === true && user.role === 'ADMIN';

    if (hardDelete) {
      const whereClause: any = { id: { in: input.ids } };
      this.applyUserFiltering(whereClause, model, user, false);
      const result = await (prisma[model as keyof typeof prisma] as any).deleteMany({ where: whereClause });
      return {
        success: true,
        data: { deleted: result.count, message: `Permanently deleted ${result.count} ${input.entityType}(s)` },
      };
    }

    const deleteData: any = { deletedAt: new Date() };
    if (model === 'user') deleteData.isActive = false;

    const whereClause: any = { id: { in: input.ids }, deletedAt: null };
    this.applyUserFiltering(whereClause, model, user, true);

    const result = await (prisma[model as keyof typeof prisma] as any).updateMany({ where: whereClause, data: deleteData });
    return {
      success: true,
      data: { deleted: result.count, message: `Successfully deleted ${result.count} ${input.entityType}(s)` },
    };
  }

  private static applyUserFiltering(where: any, model: string, user: SessionUser, _isSoftDelete: boolean) {
    if (model === 'user') {
      const mcAccess = user.mcAccess || [];
      const isAdmin = user.role === 'ADMIN';
      if (!isAdmin && mcAccess.length > 0) {
        where.mcNumberId = { in: mcAccess };
      } else if (!isAdmin) {
        where.id = { in: [] };
      }
    } else {
      where.companyId = user.companyId;
    }
  }

  // ---- Status Update Handler ----

  static async handleStatusUpdate(
    input: BulkActionInput,
    user: SessionUser,
  ): Promise<BulkActionResult> {
    if (!input.status) {
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Status is required' }, statusCode: 400 };
    }

    const modelName = entityTypeMap[input.entityType];
    const config = entityConfig[modelName];
    const model = config.model;
    const actualModel = PRISMA_MODEL_MAP[model] || model;

    const whereClause: any = { id: { in: input.ids } };
    if (!MODELS_NEEDING_STATUS_FILTER.includes(model)) whereClause.deletedAt = null;

    const filtered = await this.applyRelationalFiltering(whereClause, model, user, input.ids);
    if (!filtered.success) return filtered;

    const result = await (prisma[actualModel as keyof typeof prisma] as any).updateMany({
      where: whereClause,
      data: { status: input.status },
    });

    return {
      success: true,
      data: { updated: result.count, message: `Successfully updated status for ${result.count} ${input.entityType}(s)` },
    };
  }

  // ---- General Update Handler ----

  static async handleUpdate(
    input: BulkActionInput,
    user: SessionUser,
  ): Promise<BulkActionResult> {
    if (!input.updates) {
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Updates are required' }, statusCode: 400 };
    }

    const modelName = entityTypeMap[input.entityType];
    const config = entityConfig[modelName];
    const model = config.model;
    const actualModel = PRISMA_MODEL_MAP[model] || model;

    const updateData = { ...input.updates };
    delete updateData.id;
    delete updateData.companyId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const whereClause: any = { id: { in: input.ids } };
    if (!MODELS_NEEDING_STATUS_FILTER.includes(model)) whereClause.deletedAt = null;

    const filtered = await this.applyRelationalFiltering(whereClause, model, user, input.ids);
    if (!filtered.success) return filtered;

    const result = await (prisma[actualModel as keyof typeof prisma] as any).updateMany({
      where: whereClause,
      data: updateData,
    });

    return {
      success: true,
      data: { updated: result.count, message: `Successfully updated ${result.count} ${input.entityType}(s)` },
    };
  }

  // ---- Shared Helpers ----

  private static async applyRelationalFiltering(
    whereClause: any,
    model: string,
    user: SessionUser,
    ids: string[],
  ): Promise<BulkActionResult> {
    const relationalModels = ['accessorialCharge', 'batch', 'maintenance', 'factoringCompany', 'rateConfirmation'];

    if (relationalModels.includes(model)) {
      whereClause.companyId = user.companyId;
    } else if (model === 'loadExpense') {
      return this.filterByRelation('loadExpense', ids, user, whereClause, 'expenses');
    } else if (model === 'invoice') {
      return this.filterByRelation('invoice', ids, user, whereClause, 'invoices');
    } else if (model === 'settlement') {
      return this.filterByRelation('settlement', ids, user, whereClause, 'settlements');
    } else {
      whereClause.companyId = user.companyId;
    }

    return { success: true };
  }

  private static async filterByRelation(
    entityType: 'loadExpense' | 'invoice' | 'settlement',
    ids: string[],
    user: SessionUser,
    whereClause: any,
    label: string,
  ): Promise<BulkActionResult> {
    let companyFilter: any;
    if (entityType === 'loadExpense') {
      companyFilter = { load: { companyId: user.companyId, deletedAt: null } };
    } else if (entityType === 'invoice') {
      companyFilter = { customer: { companyId: user.companyId } };
    } else {
      companyFilter = { driver: { companyId: user.companyId } };
    }

    const records = await (prisma[entityType] as any).findMany({
      where: { id: { in: ids }, ...companyFilter },
      select: { id: true },
    });

    if (records.length === 0) {
      return {
        success: false,
        error: { code: 'NO_VALID_RECORDS', message: `No valid ${label} found to update` },
        statusCode: 400,
      };
    }

    whereClause.id = { in: records.map((r: any) => r.id) };
    return { success: true };
  }
}
