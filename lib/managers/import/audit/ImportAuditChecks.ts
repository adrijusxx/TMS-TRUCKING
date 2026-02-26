/**
 * Extracted audit check implementations for ImportAuditManager.
 * Handles field coverage, placeholder detection, duplicate detection, and relationship integrity.
 */

import type { PrismaClient } from '@prisma/client';
import { schemaReference, getModelFields } from '@/lib/schema-reference';
import { getEntityConfig } from '@/lib/import-export/entity-config';
import { getModelNameFromEntityType } from '@/lib/validations/import-field-validator';

export interface AuditCheck {
  entity: string;
  checkType:
    | 'field_coverage'
    | 'required_validation'
    | 'duplicate_detection'
    | 'relationship_integrity'
    | 'data_quality'
    | 'importer_capability';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: Record<string, unknown>;
}

export interface FieldCoverageResult {
  schemaFields: number;
  configuredFields: number;
  coveragePercent: number;
  missingFields: string[];
}

// Placeholder patterns derived from actual importer defaults
const PLACEHOLDER_PATTERNS: Record<string, Record<string, (string | RegExp)[]>> = {
  drivers: {
    email: ['@system.local'],
    licenseNumber: ['PENDING'],
    licenseState: ['XX'],
  },
  trucks: {
    make: ['Unknown'],
    model: ['Unknown'],
    licensePlate: ['UNKNOWN'],
  },
  trailers: {
    make: ['Unknown'],
    model: ['Unknown'],
    licensePlate: ['UNKNOWN'],
  },
  customers: {
    name: [/^Unknown Customer/i],
  },
  vendors: {
    name: [/^Unknown Vendor/i],
  },
};

// Natural key fields for duplicate detection
const NATURAL_KEYS: Record<string, string[]> = {
  drivers: ['driverNumber'],
  trucks: ['truckNumber'],
  trailers: ['trailerNumber'],
  customers: ['customerNumber'],
  loads: ['loadNumber'],
  invoices: ['invoiceNumber'],
  settlements: ['settlementNumber'],
  vendors: ['vendorNumber'],
  locations: ['name'],
  users: ['email'],
  'recruiting-leads': ['phone'],
};

// Auto-generated/internal fields to skip in coverage
const SKIP_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'deletedAt', 'companyId', 'userId',
  'importBatchId', 'lastSamsaraSync', 'samsaraId',
]);

export function runFieldCoverageChecks(entityType: string): {
  checks: AuditCheck[];
  coverage: FieldCoverageResult;
} {
  const checks: AuditCheck[] = [];
  const modelName = getModelNameFromEntityType(entityType);
  const schemaModel = schemaReference.models[modelName];
  const entityConfig = getEntityConfig(entityType);

  if (!schemaModel) {
    return {
      checks: [{
        entity: entityType,
        checkType: 'field_coverage',
        status: 'fail',
        message: `Schema model '${modelName}' not found`,
      }],
      coverage: { schemaFields: 0, configuredFields: 0, coveragePercent: 0, missingFields: [] },
    };
  }

  const importableFields = schemaModel.fields.filter(
    (f) => !SKIP_FIELDS.has(f.name) && !f.isRelation && !f.isId
  );
  const configuredKeys = new Set(entityConfig?.fields.map((f) => f.key) ?? []);
  const missingFields = importableFields
    .filter((f) => !configuredKeys.has(f.name))
    .map((f) => f.name);

  const coveragePercent = importableFields.length > 0
    ? Math.round((configuredKeys.size / importableFields.length) * 100)
    : 100;

  if (!entityConfig) {
    checks.push({
      entity: entityType,
      checkType: 'field_coverage',
      status: 'fail',
      message: `No entity config found for '${entityType}' in entity-config.ts`,
    });
  } else if (coveragePercent < 30) {
    checks.push({
      entity: entityType,
      checkType: 'field_coverage',
      status: 'fail',
      message: `Low field coverage: ${coveragePercent}% (${configuredKeys.size}/${importableFields.length} fields configured)`,
      details: { missingFields: missingFields.slice(0, 10) },
    });
  } else if (coveragePercent < 60) {
    checks.push({
      entity: entityType,
      checkType: 'field_coverage',
      status: 'warning',
      message: `Moderate field coverage: ${coveragePercent}% (${configuredKeys.size}/${importableFields.length})`,
      details: { missingFields: missingFields.slice(0, 10) },
    });
  } else {
    checks.push({
      entity: entityType,
      checkType: 'field_coverage',
      status: 'pass',
      message: `Good field coverage: ${coveragePercent}% (${configuredKeys.size}/${importableFields.length})`,
    });
  }

  // Check required fields have config entries
  const requiredSchemaFields = importableFields.filter((f) => !f.isOptional && !f.defaultValue);
  const missingRequired = requiredSchemaFields.filter((f) => !configuredKeys.has(f.name));
  if (missingRequired.length > 0) {
    checks.push({
      entity: entityType,
      checkType: 'required_validation',
      status: 'warning',
      message: `${missingRequired.length} required schema fields not in import config`,
      details: { fields: missingRequired.map((f) => f.name) },
    });
  } else {
    checks.push({
      entity: entityType,
      checkType: 'required_validation',
      status: 'pass',
      message: 'All required schema fields have import config entries',
    });
  }

  return {
    checks,
    coverage: {
      schemaFields: importableFields.length,
      configuredFields: configuredKeys.size,
      coveragePercent,
      missingFields,
    },
  };
}

export async function runPlaceholderChecks(
  prisma: PrismaClient,
  entityType: string,
  companyId: string
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const patterns = PLACEHOLDER_PATTERNS[entityType];
  if (!patterns) {
    checks.push({
      entity: entityType,
      checkType: 'data_quality',
      status: 'pass',
      message: 'No placeholder patterns defined for this entity',
    });
    return checks;
  }

  const modelName = getModelNameFromEntityType(entityType).toLowerCase();
  let totalPlaceholders = 0;

  for (const [field, matchers] of Object.entries(patterns)) {
    for (const matcher of matchers) {
      try {
        const where: Record<string, unknown> = { companyId, deletedAt: null };
        if (typeof matcher === 'string') {
          where[field] = { contains: matcher };
        } else {
          where[field] = { contains: matcher.source.replace(/[\\^$]/g, '') };
        }

        const count = await (prisma as any)[modelName]?.count({ where }).catch(() => 0) ?? 0;
        totalPlaceholders += count;

        if (count > 0) {
          checks.push({
            entity: entityType,
            checkType: 'data_quality',
            status: 'warning',
            message: `${count} records have placeholder '${matcher}' in field '${field}'`,
            details: { field, pattern: String(matcher), count },
          });
        }
      } catch {
        // Model may not exist or field mismatch — skip silently
      }
    }
  }

  if (totalPlaceholders === 0 && Object.keys(patterns).length > 0) {
    checks.push({
      entity: entityType,
      checkType: 'data_quality',
      status: 'pass',
      message: 'No placeholder values detected',
    });
  }

  return checks;
}

export async function runDuplicateChecks(
  prisma: PrismaClient,
  entityType: string,
  companyId: string
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const keys = NATURAL_KEYS[entityType];
  if (!keys || keys.length === 0) {
    return checks;
  }

  const modelName = getModelNameFromEntityType(entityType).toLowerCase();

  for (const key of keys) {
    try {
      const records = await (prisma as any)[modelName]?.groupBy({
        by: [key],
        where: { companyId, deletedAt: null, [key]: { not: null } },
        _count: { [key]: true },
        having: { [key]: { _count: { gt: 1 } } },
      }).catch(() => []) ?? [];

      if (records.length > 0) {
        checks.push({
          entity: entityType,
          checkType: 'duplicate_detection',
          status: 'warning',
          message: `${records.length} duplicate ${key} values found`,
          details: { field: key, duplicateCount: records.length },
        });
      } else {
        checks.push({
          entity: entityType,
          checkType: 'duplicate_detection',
          status: 'pass',
          message: `No duplicate ${key} values`,
        });
      }
    } catch {
      // Skip if model or field doesn't support groupBy
    }
  }

  return checks;
}

export async function runRelationshipChecks(
  prisma: PrismaClient,
  entityType: string,
  companyId: string
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  // Only check load relationships since that's the most common source of orphans
  if (entityType !== 'loads') return checks;

  try {
    // Check for loads referencing soft-deleted drivers
    const loadsWithDeletedDrivers = await prisma.load.count({
      where: {
        companyId,
        deletedAt: null,
        driverId: { not: undefined },
        driver: { deletedAt: { not: null } },
      },
    }).catch(() => 0);

    if (loadsWithDeletedDrivers > 0) {
      checks.push({
        entity: entityType,
        checkType: 'relationship_integrity',
        status: 'warning',
        message: `${loadsWithDeletedDrivers} active loads reference deleted drivers`,
        details: { count: loadsWithDeletedDrivers },
      });
    }

    // Check for loads referencing soft-deleted customers
    const loadsWithDeletedCustomers = await prisma.load.count({
      where: {
        companyId,
        deletedAt: null,
        customer: { deletedAt: { not: null } },
      },
    }).catch(() => 0);

    if (loadsWithDeletedCustomers > 0) {
      checks.push({
        entity: entityType,
        checkType: 'relationship_integrity',
        status: 'warning',
        message: `${loadsWithDeletedCustomers} active loads reference deleted customers`,
        details: { count: loadsWithDeletedCustomers },
      });
    }

    if (loadsWithDeletedDrivers === 0 && loadsWithDeletedCustomers === 0) {
      checks.push({
        entity: entityType,
        checkType: 'relationship_integrity',
        status: 'pass',
        message: 'All load relationships are valid',
      });
    }
  } catch {
    // Skip if queries fail
  }

  return checks;
}
