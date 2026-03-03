/**
 * TariffManager
 *
 * Manages tariff/rate bulk upload and version history.
 * Supports CSV-parsed tariff data with upsert semantics.
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { AuditTrailManager } from './AuditTrailManager';
import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

export interface TariffUploadRow {
  name: string;
  origin?: string;
  destination?: string;
  rate: number;
  fuelSurcharge?: number;
  effectiveDate?: string;
  type?: string;
  minimumRate?: number;
}

export interface BulkUploadResult {
  created: number;
  updated: number;
  errors: TariffRowError[];
  totalProcessed: number;
}

export interface TariffRowError {
  row: number;
  field?: string;
  message: string;
}

export interface TariffVersionEntry {
  id: string;
  uploadedAt: string;
  uploadedBy: string | null;
  tariffCount: number;
  effectiveDate: string | null;
}

// ============================================
// TariffManager
// ============================================

export class TariffManager {
  /**
   * Bulk upload tariffs — creates or updates tariff entries.
   * Uses best-effort parsing: valid rows are saved, invalid rows yield warnings.
   */
  static async bulkUploadTariffs(
    companyId: string,
    tariffData: TariffUploadRow[],
    effectiveDate: Date,
    userId?: string
  ): Promise<BulkUploadResult> {
    if (tariffData.length === 0) {
      throw new ValidationError('No tariff data provided');
    }

    if (tariffData.length > 5000) {
      throw new ValidationError('Maximum 5000 tariff rows per upload');
    }

    const result: BulkUploadResult = { created: 0, updated: 0, errors: [], totalProcessed: 0 };

    for (let i = 0; i < tariffData.length; i++) {
      const row = tariffData[i];
      const rowNum = i + 1;

      try {
        const validated = this.validateRow(row, rowNum);
        if (!validated) {
          result.errors.push({ row: rowNum, message: 'Invalid row data' });
          continue;
        }

        await this.upsertTariff(companyId, validated, effectiveDate);

        if (validated._isUpdate) {
          result.updated++;
        } else {
          result.created++;
        }
      } catch (err) {
        result.errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      result.totalProcessed++;
    }

    // Record audit trail
    await AuditTrailManager.record({
      companyId,
      userId,
      entityType: 'TARIFF_BULK_UPLOAD',
      entityId: effectiveDate.toISOString(),
      action: 'CREATE',
      description: `Bulk uploaded ${result.created} new, ${result.updated} updated tariffs (${result.errors.length} errors)`,
      metadata: {
        created: result.created,
        updated: result.updated,
        errors: result.errors.length,
        effectiveDate: effectiveDate.toISOString(),
      },
    });

    return result;
  }

  /**
   * Get tariff version history — returns upload batches by date.
   */
  static async getTariffVersionHistory(
    companyId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<TariffVersionEntry[]> {
    const logs = await prisma.activityLog.findMany({
      where: {
        companyId,
        entityType: 'TARIFF_BULK_UPLOAD',
        action: 'CREATE',
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      uploadedAt: log.createdAt.toISOString(),
      uploadedBy: log.user
        ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() || log.user.email
        : null,
      tariffCount: ((log.metadata as any)?.created ?? 0) + ((log.metadata as any)?.updated ?? 0),
      effectiveDate: log.entityId ?? null,
    }));
  }

  /**
   * Parse CSV text into TariffUploadRow array.
   * Expected columns: name, origin, destination, rate, fuelSurcharge, effectiveDate
   */
  static parseCSV(csvText: string): TariffUploadRow[] {
    const lines = csvText.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new ValidationError('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: TariffUploadRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() ?? '';
      });

      rows.push({
        name: row['name'] || `Tariff-${i}`,
        origin: row['origin'] || row['originzip'] || undefined,
        destination: row['destination'] || row['destinationzip'] || undefined,
        rate: parseFloat(row['rate'] || '0'),
        fuelSurcharge: row['fuelsurcharge'] ? parseFloat(row['fuelsurcharge']) : undefined,
        effectiveDate: row['effectivedate'] || undefined,
        type: row['type'] || undefined,
        minimumRate: row['minimumrate'] ? parseFloat(row['minimumrate']) : undefined,
      });
    }

    return rows;
  }

  // ============================================
  // Private Helpers
  // ============================================

  private static validateRow(
    row: TariffUploadRow,
    rowNum: number
  ): (TariffUploadRow & { _isUpdate?: boolean }) | null {
    if (!row.name || row.name.trim().length === 0) {
      throw new ValidationError(`Row ${rowNum}: name is required`);
    }

    if (isNaN(row.rate) || row.rate < 0) {
      throw new ValidationError(`Row ${rowNum}: rate must be a non-negative number`);
    }

    if (row.fuelSurcharge !== undefined && (isNaN(row.fuelSurcharge) || row.fuelSurcharge < 0)) {
      throw new ValidationError(`Row ${rowNum}: fuelSurcharge must be non-negative`);
    }

    return row;
  }

  private static async upsertTariff(
    companyId: string,
    row: TariffUploadRow & { _isUpdate?: boolean },
    effectiveDate: Date
  ): Promise<void> {
    const existing = await prisma.tariff.findFirst({
      where: {
        companyId,
        name: row.name,
        deletedAt: null,
      },
    });

    const tariffType = this.mapTariffType(row.type);

    if (existing) {
      row._isUpdate = true;
      await prisma.tariff.update({
        where: { id: existing.id },
        data: {
          rate: row.rate,
          fuelSurcharge: row.fuelSurcharge ?? existing.fuelSurcharge,
          originZip: row.origin ?? existing.originZip,
          destinationZip: row.destination ?? existing.destinationZip,
          effectiveDate,
          type: tariffType,
          minimumRate: row.minimumRate ?? existing.minimumRate,
          updatedAt: new Date(),
        },
      });
    } else {
      row._isUpdate = false;
      await prisma.tariff.create({
        data: {
          companyId,
          name: row.name,
          rate: row.rate,
          fuelSurcharge: row.fuelSurcharge,
          originZip: row.origin,
          destinationZip: row.destination,
          effectiveDate,
          type: tariffType,
          minimumRate: row.minimumRate,
        },
      });
    }
  }

  private static mapTariffType(type?: string): any {
    const map: Record<string, string> = {
      'per_mile': 'RATE_PER_MILE',
      'rate_per_mile': 'RATE_PER_MILE',
      'per_load': 'RATE_PER_LOAD',
      'rate_per_load': 'RATE_PER_LOAD',
      'per_pound': 'RATE_PER_POUND',
      'rate_per_pound': 'RATE_PER_POUND',
      'flat': 'FLAT_RATE',
      'flat_rate': 'FLAT_RATE',
      'percentage': 'PERCENTAGE',
      'fuel_surcharge': 'FUEL_SURCHARGE',
    };

    if (!type) return 'RATE_PER_MILE';
    return map[type.toLowerCase()] || 'RATE_PER_MILE';
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
