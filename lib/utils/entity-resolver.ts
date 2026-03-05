/**
 * Entity Resolver Utility
 *
 * Resolves URL parameters that can be either a raw CUID or a user-friendly
 * entity number (e.g., "L-0042", "D-001", "SET-2026-000142") to the entity's
 * internal database ID.
 *
 * CONVENTIONS (enforced project-wide):
 * - Every new entity route MUST be added to ENTITY_CONFIG below
 * - All navigation MUST use buildEntityUrl() — never construct `/dashboard/{entity}/${id}` manually
 * - All API [id] routes MUST use resolveEntityParam() to resolve the URL param
 * - Register new entities in ENTITY_CONFIG when adding new [id] API routes
 */

import { prisma } from '@/lib/prisma';

/** CUID v1: starts with 'c', 25 chars, lowercase alphanumeric */
const CUID_REGEX = /^c[a-z0-9]{20,28}$/;

/** Detect whether a parameter looks like a CUID (raw database ID) */
export function isCuid(param: string): boolean {
  return CUID_REGEX.test(param);
}

/**
 * Entity configuration registry.
 * Maps route entity type → Prisma model name, number field, and company scoping.
 */
export const ENTITY_CONFIG = {
  loads:                { model: 'load',              numberField: 'loadNumber',        scoped: true,  softDelete: true },
  drivers:              { model: 'driver',            numberField: 'driverNumber',      scoped: true,  softDelete: true },
  trucks:               { model: 'truck',             numberField: 'truckNumber',       scoped: true,  softDelete: true },
  trailers:             { model: 'trailer',           numberField: 'trailerNumber',     scoped: true,  softDelete: true },
  customers:            { model: 'customer',          numberField: 'customerNumber',    scoped: true,  softDelete: true },
  settlements:          { model: 'settlement',        numberField: 'settlementNumber',  scoped: false, softDelete: false },
  invoices:             { model: 'invoice',           numberField: 'invoiceNumber',     scoped: true,  softDelete: true },
  maintenance:          { model: 'maintenanceRecord', numberField: 'maintenanceNumber', scoped: true,  softDelete: true },
  breakdowns:           { model: 'breakdown',         numberField: 'breakdownNumber',   scoped: true,  softDelete: true },
  incidents:            { model: 'safetyIncident',    numberField: 'incidentNumber',    scoped: false, softDelete: true },
  'fuel-entries':       { model: 'fuelEntry',         numberField: 'fuelEntryNumber',   scoped: false, softDelete: false },
  'company-expenses':   { model: 'companyExpense',    numberField: 'expenseNumber',     scoped: false, softDelete: true },
  vendors:              { model: 'vendor',            numberField: 'vendorNumber',      scoped: true,  softDelete: true },
  'vendor-bills':       { model: 'vendorBill',        numberField: 'billNumber',        scoped: true,  softDelete: false },
  inventory:            { model: 'inventoryItem',     numberField: 'itemNumber',        scoped: true,  softDelete: true },
  inspections:          { model: 'inspection',        numberField: 'inspectionNumber',  scoped: true,  softDelete: true },
  locations:            { model: 'location',          numberField: 'locationNumber',    scoped: true,  softDelete: true },
  leads:                { model: 'lead',              numberField: 'leadNumber',        scoped: true,  softDelete: true },
  'salary-batches':     { model: 'salaryBatch',       numberField: 'batchNumber',       scoped: true,  softDelete: false },
  'invoice-batches':    { model: 'invoiceBatch',      numberField: 'batchNumber',       scoped: true,  softDelete: false },
  'vendor-bill-batches':{ model: 'vendorBillBatch',   numberField: 'batchNumber',       scoped: true,  softDelete: false },
} as const;

export type ResolvableEntity = keyof typeof ENTITY_CONFIG;

interface ResolvedEntity {
  id: string;
  number: string;
}

/**
 * Resolve a URL parameter (CUID or entity number) to an entity record.
 *
 * @param entityType - Key from ENTITY_CONFIG (e.g., 'loads', 'drivers')
 * @param param - The URL parameter (raw CUID or user-friendly number)
 * @param companyId - Required for company-scoped entities
 * @returns { id, number } or null if not found
 */
export async function resolveEntityParam(
  entityType: ResolvableEntity,
  param: string,
  companyId?: string
): Promise<ResolvedEntity | null> {
  const config = ENTITY_CONFIG[entityType];
  const model = (prisma as any)[config.model];
  if (!model) return null;

  const where: Record<string, any> = {};

  if (isCuid(param)) {
    where.id = param;
  } else {
    where[config.numberField] = decodeURIComponent(param);
  }

  if (config.scoped) {
    if (!companyId) {
      throw new Error(`companyId required for ${entityType} resolution`);
    }
    where.companyId = companyId;
  }

  if (config.softDelete) {
    where.deletedAt = null;
  }

  try {
    const record = await model.findFirst({
      where,
      select: { id: true, [config.numberField]: true },
    });
    if (!record) return null;
    return { id: record.id, number: record[config.numberField] ?? record.id };
  } catch {
    return null;
  }
}

/**
 * Build a user-friendly dashboard URL for an entity.
 * Use this instead of manually constructing `/dashboard/{entity}/${id}`.
 *
 * @param entityType - Dashboard path segment (e.g., 'loads', 'drivers')
 * @param number - The entity's user-friendly number (e.g., 'L-0042')
 * @param query - Optional query string (e.g., '?tab=payroll')
 */
export function buildEntityUrl(
  entityType: string,
  number: string,
  query?: string
): string {
  const encoded = encodeURIComponent(number);
  return `/dashboard/${entityType}/${encoded}${query ? `?${query}` : ''}`;
}
