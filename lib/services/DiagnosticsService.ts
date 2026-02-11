/**
 * Fleet Diagnostics Service
 * 
 * Handles syncing fault codes from Samsara, querying diagnostics,
 * computing analytics, and providing troubleshooting guidance.
 */

import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleDiagnostics } from '@/lib/integrations/samsara';
import { DTC_CODES_DATABASE, getDTCInfo, categorizeFaultCode } from '@/lib/data/dtc-codes';

// ============================================
// TYPES
// ============================================

export interface DiagnosticsFilter {
  companyId: string;
  status?: 'active' | 'resolved' | 'all';
  severity?: string;
  category?: string;
  truckId?: string;
  truckIds?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface DiagnosticsSyncResult {
  synced: number;
  new: number;
  updated: number;
  errors: string[];
  lastSyncTime: Date;
}

export interface DiagnosticsAnalytics {
  summary: {
    totalActive: number;
    totalResolved: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    trucksAffected: number;
    checkEngineLightCount: number;
  };
  byCategory: Array<{ category: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  topCodes: Array<{ code: string; description: string; count: number }>;
  trend: Array<{ date: string; count: number }>;
  fleetHealthScore: number;
}

export interface TroubleshootingInfo {
  code: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  urgency: string;
  commonCauses: string[];
  troubleshooting: string[];
  estimatedCost: string | null;
  source: 'database' | 'ai';
  aiGenerated?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

export class DiagnosticsService {
  private readonly companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Sync diagnostics from Samsara to database
   */
  async syncFromSamsara(): Promise<DiagnosticsSyncResult> {
    const result: DiagnosticsSyncResult = {
      synced: 0,
      new: 0,
      updated: 0,
      errors: [],
      lastSyncTime: new Date(),
    };

    try {
      // Get all trucks with Samsara IDs
      const trucks = await prisma.truck.findMany({
        where: {
          companyId: this.companyId,
          samsaraId: { not: null },
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          truckNumber: true,
          samsaraId: true,
          odometerReading: true,
        },
      });

      if (trucks.length === 0) {
        result.errors.push('No Samsara-linked trucks found');
        return result;
      }

      const samsaraIds = trucks.map(t => t.samsaraId!);
      const truckBySamsaraId = new Map(trucks.map(t => [t.samsaraId!, t]));

      // Fetch diagnostics from Samsara
      const diagnostics = await getSamsaraVehicleDiagnostics(samsaraIds, this.companyId);

      if (!diagnostics || diagnostics.length === 0) {
        return result;
      }

      const now = new Date();

      for (const entry of diagnostics) {
        const truck = truckBySamsaraId.get(entry.vehicleId);
        if (!truck) continue;

        const faults = entry.faults || [];
        const checkEngineLight = entry.checkEngineLightOn || false;

        for (const fault of faults) {
          if (!fault.code) continue;

          try {
            // Categorize the fault code
            const codeInfo = categorizeFaultCode(fault.code);
            const dtcInfo = getDTCInfo(fault.code);

            // Create unique identifier for this fault instance
            const occurredAt = fault.occurredAt ? new Date(fault.occurredAt) : now;

            // Upsert fault record
            const existing = await prisma.truckFaultHistory.findFirst({
              where: {
                truckId: truck.id,
                faultCode: fault.code,
                occurredAt: occurredAt,
              },
            });

            const mappedSeverity = (fault.severity || codeInfo.severity || 'WARNING').toUpperCase();

            if (existing) {
              // Update existing record
              await prisma.truckFaultHistory.update({
                where: { id: existing.id },
                data: {
                  description: fault.description || dtcInfo?.description || existing.description,
                  severity: mappedSeverity,
                  isActive: fault.active !== false,
                  updatedAt: now,
                },
              });
              result.updated++;
            } else {
              // Create new record
              await prisma.truckFaultHistory.create({
                data: {
                  truckId: truck.id,
                  companyId: this.companyId,
                  faultCode: fault.code,
                  description: fault.description || dtcInfo?.description,
                  severity: mappedSeverity,
                  source: 'SAMSARA',
                  samsaraFaultId: `${entry.vehicleId}-${fault.code}-${occurredAt.getTime()}`,
                  occurredAt: occurredAt,
                  isActive: fault.active !== false,
                },
              });
              result.new++;
            }

            result.synced++;
          } catch (err: any) {
            result.errors.push(`${truck.truckNumber} - ${fault.code}: ${err.message}`);
          }
        }

        // If vehicle has check engine light but no faults, create a generic entry
        if (checkEngineLight && faults.length === 0) {
          try {
            const existing = await prisma.truckFaultHistory.findFirst({
              where: {
                truckId: truck.id,
                faultCode: 'CEL',
                isActive: true,
              },
            });

            if (!existing) {
              await prisma.truckFaultHistory.create({
                data: {
                  truckId: truck.id,
                  companyId: this.companyId,
                  faultCode: 'CEL',
                  description: 'Check Engine Light On (specific code not reported)',
                  severity: 'WARNING',
                  source: 'SAMSARA',
                  samsaraFaultId: `${entry.vehicleId}-CEL-${now.getTime()}`,
                  occurredAt: now,
                  isActive: true,
                },
              });
              result.new++;
              result.synced++;
            }
          } catch (err: any) {
            result.errors.push(`${truck.truckNumber} - CEL: ${err.message}`);
          }
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Get diagnostics with filtering and pagination
   */
  async getDiagnostics(filters: DiagnosticsFilter) {
    const {
      status = 'active',
      severity,
      category,
      truckId,
      truckIds,
      search,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 50,
    } = filters;

    const where: any = {
      companyId: this.companyId,
    };

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'resolved') {
      where.isActive = false;
      where.resolvedAt = { not: null };
    }

    // Severity filter
    if (severity) {
      where.severity = severity.toUpperCase();
    }

    // Category filter - categorize codes dynamically from faultCode pattern
    // Note: Category is derived from fault code pattern, not stored in DB
    // Filtering by category would require fetching all and filtering in memory
    // For now, category filtering is not supported at the database level

    // Truck filter
    if (truckId) {
      where.truckId = truckId;
    } else if (truckIds && truckIds.length > 0) {
      where.truckId = { in: truckIds };
    }

    // Search filter
    if (search) {
      where.OR = [
        { faultCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.occurredAt = {};
      if (dateFrom) where.occurredAt.gte = dateFrom;
      if (dateTo) where.occurredAt.lte = dateTo;
    }

    // If category filter is applied, we need to fetch more and filter in memory
    const needsCategoryFilter = !!category;
    const fetchSize = needsCategoryFilter ? pageSize * 5 : pageSize; // Fetch more if filtering by category

    let [rawItems, total] = await Promise.all([
      prisma.truckFaultHistory.findMany({
        where,
        include: {
          truck: {
            select: {
              id: true,
              truckNumber: true,
              make: true,
              model: true,
              year: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { severity: 'asc' }, // CRITICAL first (A comes before W in ASC when uppercase)
          { occurredAt: 'desc' },
        ],
        skip: needsCategoryFilter ? 0 : (page - 1) * pageSize,
        take: needsCategoryFilter ? fetchSize : pageSize,
      }),
      prisma.truckFaultHistory.count({ where }),
    ]);

    // Add derived category to each item
    let items = rawItems.map(item => {
      const codeInfo = categorizeFaultCode(item.faultCode);
      return {
        ...item,
        category: codeInfo.category,
        spnId: codeInfo.spnId,
        fmiId: codeInfo.fmiId,
        checkEngineLight: item.faultCode === 'CEL',
      };
    });

    // Apply category filter if specified
    if (category) {
      items = items.filter(item => item.category === category.toLowerCase());
      total = items.length;
      // Apply pagination after filtering
      items = items.slice((page - 1) * pageSize, page * pageSize);
    }

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get analytics and statistics
   */
  async getAnalytics(dateFrom?: Date, dateTo?: Date): Promise<DiagnosticsAnalytics> {
    const baseWhere: any = { companyId: this.companyId };

    if (dateFrom || dateTo) {
      baseWhere.occurredAt = {};
      if (dateFrom) baseWhere.occurredAt.gte = dateFrom;
      if (dateTo) baseWhere.occurredAt.lte = dateTo;
    }

    // Get summary counts
    const [
      totalActive,
      totalResolved,
      criticalCount,
      warningCount,
      infoCount,
      trucksAffected,
    ] = await Promise.all([
      prisma.truckFaultHistory.count({ where: { ...baseWhere, isActive: true } }),
      prisma.truckFaultHistory.count({ where: { ...baseWhere, isActive: false, resolvedAt: { not: null } } }),
      prisma.truckFaultHistory.count({ where: { ...baseWhere, isActive: true, severity: 'CRITICAL' } }),
      prisma.truckFaultHistory.count({ where: { ...baseWhere, isActive: true, severity: 'WARNING' } }),
      prisma.truckFaultHistory.count({ where: { ...baseWhere, isActive: true, severity: 'INFO' } }),
      prisma.truckFaultHistory.groupBy({
        by: ['truckId'],
        where: { ...baseWhere, isActive: true },
      }).then(r => r.length),
    ]);

    // Count CEL codes as check engine light indicator
    const checkEngineLightCount = await prisma.truckFaultHistory.count({
      where: { ...baseWhere, isActive: true, faultCode: 'CEL' },
    });

    // Get all active faults to categorize by fault code pattern
    const activeFaults = await prisma.truckFaultHistory.findMany({
      where: { ...baseWhere, isActive: true },
      select: { faultCode: true },
    });

    // Categorize faults dynamically based on code patterns
    const categoryMap = new Map<string, number>();
    activeFaults.forEach(fault => {
      const { category } = categorizeFaultCode(fault.faultCode);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count: count }))
      .sort((a, b) => b.count - a.count);

    // Get by severity
    const bySeverity = await prisma.truckFaultHistory.groupBy({
      by: ['severity'],
      where: { ...baseWhere, isActive: true },
      _count: { severity: true },
    });

    // Get top codes
    const topCodes = await prisma.truckFaultHistory.groupBy({
      by: ['faultCode', 'description'],
      where: { ...baseWhere, isActive: true },
      _count: { faultCode: true },
      orderBy: { _count: { faultCode: 'desc' } },
      take: 10,
    });

    // Get trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await prisma.truckFaultHistory.findMany({
      where: {
        ...baseWhere,
        occurredAt: { gte: thirtyDaysAgo },
      },
      select: { occurredAt: true },
    });

    // Group by date
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendMap.set(date.toISOString().split('T')[0], 0);
    }

    trendData.forEach(item => {
      const dateStr = item.occurredAt.toISOString().split('T')[0];
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate fleet health score (0-100)
    const totalTrucks = await prisma.truck.count({
      where: { companyId: this.companyId, isActive: true, deletedAt: null },
    });

    const healthyTrucks = totalTrucks - trucksAffected;
    const criticalPenalty = criticalCount * 10;
    const warningPenalty = warningCount * 3;
    const fleetHealthScore = Math.max(0, Math.min(100,
      Math.round((healthyTrucks / Math.max(totalTrucks, 1)) * 100 - criticalPenalty - warningPenalty)
    ));

    return {
      summary: {
        totalActive,
        totalResolved,
        criticalCount,
        warningCount,
        infoCount,
        trucksAffected,
        checkEngineLightCount,
      },
      byCategory,
      bySeverity: bySeverity.map(s => ({
        severity: s.severity || 'unknown',
        count: s._count.severity,
      })),
      topCodes: topCodes.map(t => ({
        code: t.faultCode,
        description: t.description || 'Unknown',
        count: t._count.faultCode,
      })),
      trend,
      fleetHealthScore,
    };
  }

  /**
   * Get troubleshooting info for a specific code
   */
  async getTroubleshooting(code: string): Promise<TroubleshootingInfo> {
    // Check static database first (DiagnosticCodeReference table not yet migrated)
    const staticInfo = getDTCInfo(code);
    if (staticInfo) {
      return {
        ...staticInfo,
        source: 'database',
      };
    }

    // Fallback: Generate basic info from code pattern
    const codeInfo = categorizeFaultCode(code);

    return {
      code: code.toUpperCase(),
      name: `Diagnostic Code ${code}`,
      description: `Diagnostic trouble code ${code} detected`,
      category: codeInfo.category || 'unknown',
      severity: codeInfo.severity || 'warning',
      urgency: codeInfo.severity === 'critical' ? 'immediate' : 'soon',
      commonCauses: [
        'Sensor malfunction',
        'Wiring issue',
        'Component failure',
        'Software/calibration issue',
      ],
      troubleshooting: [
        'Check for related codes that might indicate the root cause',
        'Inspect wiring and connections for damage or corrosion',
        'Verify sensor readings are within normal range',
        'Consult service manual for specific diagnostic procedures',
        'Consider professional diagnosis if issue persists',
      ],
      estimatedCost: null,
      source: 'ai',
      aiGenerated: 'This troubleshooting information was generated automatically. For accurate diagnosis, consult a qualified technician.',
    };
  }

  /**
   * Mark a fault as resolved
   */
  async resolveFault(faultId: string, userId: string, notes?: string) {
    return prisma.truckFaultHistory.update({
      where: { id: faultId },
      data: {
        isActive: false,
        resolvedAt: new Date(),
        resolvedById: userId,
        resolutionNotes: notes,
      },
    });
  }

  /**
   * Reactivate a resolved fault
   */
  async reactivateFault(faultId: string) {
    return prisma.truckFaultHistory.update({
      where: { id: faultId },
      data: {
        isActive: true,
        resolvedAt: null,
        resolvedById: null,
        resolutionNotes: null,
      },
    });
  }
}

// ============================================
// SINGLETON FACTORY
// ============================================

const serviceCache = new Map<string, DiagnosticsService>();

export function getDiagnosticsService(companyId: string): DiagnosticsService {
  if (!serviceCache.has(companyId)) {
    serviceCache.set(companyId, new DiagnosticsService(companyId));
  }
  return serviceCache.get(companyId)!;
}

