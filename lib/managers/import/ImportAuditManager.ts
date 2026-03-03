/**
 * ImportAuditManager — Validates all importers structurally and at the data level.
 * Structural: field coverage vs schema, importer capabilities.
 * Data quality: placeholders, orphaned FKs, duplicates.
 */

import type { PrismaClient } from '@prisma/client';
import { getAllEntityTypes } from '@/lib/import-export/entity-config';
import {
  type AuditCheck,
  type FieldCoverageResult,
  runFieldCoverageChecks,
  runPlaceholderChecks,
  runDuplicateChecks,
  runRelationshipChecks,
} from './audit/ImportAuditChecks';

export interface ImporterCapabilities {
  hasPreviewMode: boolean;
  hasBatchOptimization: boolean;
  hasUpdateExisting: boolean;
}

export interface EntityAuditResult {
  entity: string;
  overallScore: number;
  checks: AuditCheck[];
  importerCapabilities: ImporterCapabilities;
  fieldCoverage: FieldCoverageResult;
}

export interface FullAuditResult {
  timestamp: string;
  entities: EntityAuditResult[];
  overallScore: number;
  recommendations: string[];
}

// Static registry of importer capabilities (derived from code analysis)
const IMPORTER_REGISTRY: Record<string, ImporterCapabilities> = {
  drivers: { hasPreviewMode: true, hasBatchOptimization: false, hasUpdateExisting: true },
  customers: { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  loads: { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  trucks: { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  trailers: { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  vendors: { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  locations: { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  users: { hasPreviewMode: true, hasBatchOptimization: false, hasUpdateExisting: true },
  'recruiting-leads': { hasPreviewMode: true, hasBatchOptimization: true, hasUpdateExisting: true },
  invoices: { hasPreviewMode: true, hasBatchOptimization: false, hasUpdateExisting: true },
  settlements: { hasPreviewMode: true, hasBatchOptimization: false, hasUpdateExisting: true },
};

// All entity types that have importers
const IMPORTER_ENTITY_TYPES = [
  'drivers', 'customers', 'loads', 'trucks', 'trailers',
  'vendors', 'locations', 'users', 'recruiting-leads',
  'invoices', 'settlements',
];

export class ImportAuditManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Audit a single entity type (structural + optional data quality)
   */
  async auditEntity(
    entityType: string,
    companyId?: string,
    includeDataQuality = false
  ): Promise<EntityAuditResult> {
    const checks: AuditCheck[] = [];

    // 1. Structural: field coverage
    const { checks: coverageChecks, coverage } = runFieldCoverageChecks(entityType);
    checks.push(...coverageChecks);

    // 2. Importer capabilities
    const capabilities = IMPORTER_REGISTRY[entityType] ?? {
      hasPreviewMode: false,
      hasBatchOptimization: false,
      hasUpdateExisting: false,
    };

    if (!capabilities.hasPreviewMode) {
      checks.push({
        entity: entityType,
        checkType: 'importer_capability',
        status: 'warning',
        message: 'Importer does not support preview mode',
      });
    }
    if (!capabilities.hasBatchOptimization) {
      checks.push({
        entity: entityType,
        checkType: 'importer_capability',
        status: 'warning',
        message: 'Importer creates records one-by-one (no batch optimization)',
      });
    }

    // 3. Data quality (if requested and companyId provided)
    if (includeDataQuality && companyId) {
      const [placeholderChecks, duplicateChecks, relationshipChecks] = await Promise.all([
        runPlaceholderChecks(this.prisma, entityType, companyId),
        runDuplicateChecks(this.prisma, entityType, companyId),
        runRelationshipChecks(this.prisma, entityType, companyId),
      ]);
      checks.push(...placeholderChecks, ...duplicateChecks, ...relationshipChecks);
    }

    return {
      entity: entityType,
      overallScore: this.calculateEntityScore(checks),
      checks,
      importerCapabilities: capabilities,
      fieldCoverage: coverage,
    };
  }

  /**
   * Audit all entity types that have importers
   */
  async auditAll(companyId?: string, includeDataQuality = false): Promise<FullAuditResult> {
    const results = await Promise.all(
      IMPORTER_ENTITY_TYPES.map((et) => this.auditEntity(et, companyId, includeDataQuality))
    );

    const overallScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length)
      : 0;

    return {
      timestamp: new Date().toISOString(),
      entities: results,
      overallScore,
      recommendations: this.generateRecommendations(results),
    };
  }

  /**
   * Data quality audit only (requires companyId)
   */
  async auditDataQuality(entityType: string, companyId: string): Promise<AuditCheck[]> {
    const [placeholderChecks, duplicateChecks, relationshipChecks] = await Promise.all([
      runPlaceholderChecks(this.prisma, entityType, companyId),
      runDuplicateChecks(this.prisma, entityType, companyId),
      runRelationshipChecks(this.prisma, entityType, companyId),
    ]);
    return [...placeholderChecks, ...duplicateChecks, ...relationshipChecks];
  }

  private calculateEntityScore(checks: AuditCheck[]): number {
    if (checks.length === 0) return 100;

    let score = 100;
    for (const check of checks) {
      if (check.status === 'fail') score -= 20;
      else if (check.status === 'warning') score -= 5;
    }
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(results: EntityAuditResult[]): string[] {
    const recs: string[] = [];

    const noPreview = results.filter((r) => !r.importerCapabilities.hasPreviewMode);
    if (noPreview.length > 0) {
      recs.push(
        `${noPreview.map((r) => r.entity).join(', ')} importers lack preview mode — users cannot preview before importing`
      );
    }

    const noBatch = results.filter((r) => !r.importerCapabilities.hasBatchOptimization);
    if (noBatch.length > 0) {
      recs.push(
        `${noBatch.map((r) => r.entity).join(', ')} importers create records individually — may be slow for large datasets`
      );
    }

    const lowCoverage = results.filter((r) => r.fieldCoverage.coveragePercent < 50);
    if (lowCoverage.length > 0) {
      recs.push(
        `${lowCoverage.map((r) => r.entity).join(', ')} have low field coverage — consider adding more fields to entity-config.ts`
      );
    }

    const failedChecks = results.filter((r) => r.checks.some((c) => c.status === 'fail'));
    if (failedChecks.length > 0) {
      recs.push(
        `${failedChecks.map((r) => r.entity).join(', ')} have failing checks — review data quality issues`
      );
    }

    // Check for entity configs without importers
    const configuredTypes = new Set(getAllEntityTypes());
    const importerTypes = new Set(IMPORTER_ENTITY_TYPES);
    const configOnlyTypes = [...configuredTypes].filter((t) => !importerTypes.has(t));
    if (configOnlyTypes.length > 0) {
      recs.push(
        `Entity configs exist for ${configOnlyTypes.join(', ')} but no importers are registered`
      );
    }

    return recs;
  }
}
