import type { PrismaClient } from '@prisma/client';

const MIN_LOAD_COUNT = 2;
const MIN_CONFIDENCE = 60;

interface LoadRow {
  driverId: string | null;
  truckId: string | null;
  trailerId: string | null;
  dispatcherId: string | null;
}

interface DriverProfile {
  id: string;
  currentTruckId: string | null;
  currentTrailerId: string | null;
  assignedDispatcherId: string | null;
}

export interface EquipmentSuggestion {
  driverId: string;
  suggestionType: 'TRUCK_CHANGE' | 'TRAILER_CHANGE' | 'DISPATCHER_LINK' | 'NEW_ASSIGNMENT';
  loadCount: number;
  confidence: number;
  suggestedTruckId?: string | null;
  suggestedTrailerId?: string | null;
  suggestedDispatcherId?: string | null;
  currentTruckId?: string | null;
  currentTrailerId?: string | null;
  currentDispatcherId?: string | null;
}

/**
 * Analyzes imported loads for driver-equipment patterns and persists suggestions.
 * Runs after all import chunks complete for a load import session.
 */
export class ImportEquipmentAnalyzer {
  constructor(
    private prisma: PrismaClient,
    private companyId: string
  ) {}

  async analyzeAndPersist(importBatchIds: string[]): Promise<EquipmentSuggestion[]> {
    const suggestions = await this.analyze(importBatchIds);
    if (suggestions.length === 0) return [];

    // Use the first batch ID as the "primary" for grouping
    const primaryBatchId = importBatchIds[0];
    await this.persistSuggestions(primaryBatchId, suggestions);
    return suggestions;
  }

  async analyze(importBatchIds: string[]): Promise<EquipmentSuggestion[]> {
    if (importBatchIds.length === 0) return [];

    const loads = await this.prisma.load.findMany({
      where: {
        importBatchId: { in: importBatchIds },
        companyId: this.companyId,
        deletedAt: null,
      },
      select: { driverId: true, truckId: true, trailerId: true, dispatcherId: true },
    });

    if (loads.length === 0) return [];

    const grouped = this.groupByDriver(loads);
    const driverIds = Array.from(grouped.keys());

    const drivers = await this.prisma.driver.findMany({
      where: { id: { in: driverIds }, companyId: this.companyId, deletedAt: null },
      select: { id: true, currentTruckId: true, currentTrailerId: true, assignedDispatcherId: true },
    });

    const driverMap = new Map(drivers.map(d => [d.id, d]));
    const suggestions: EquipmentSuggestion[] = [];

    for (const [driverId, driverLoads] of grouped) {
      const profile = driverMap.get(driverId);
      if (!profile) continue;

      const truckSuggestion = this.computeTruckSuggestion(driverId, driverLoads, profile);
      if (truckSuggestion) suggestions.push(truckSuggestion);

      const trailerSuggestion = this.computeTrailerSuggestion(driverId, driverLoads, profile);
      if (trailerSuggestion) suggestions.push(trailerSuggestion);

      const dispatcherSuggestion = this.computeDispatcherSuggestion(driverId, driverLoads, profile);
      if (dispatcherSuggestion) suggestions.push(dispatcherSuggestion);
    }

    return suggestions;
  }

  private groupByDriver(loads: LoadRow[]): Map<string, LoadRow[]> {
    const map = new Map<string, LoadRow[]>();
    for (const load of loads) {
      if (!load.driverId) continue;
      const existing = map.get(load.driverId);
      if (existing) existing.push(load);
      else map.set(load.driverId, [load]);
    }
    return map;
  }

  private computeTruckSuggestion(
    driverId: string,
    loads: LoadRow[],
    profile: DriverProfile
  ): EquipmentSuggestion | null {
    const result = this.frequency(loads.map(l => l.truckId).filter(Boolean) as string[]);
    if (!result || result.count < MIN_LOAD_COUNT) return null;

    const confidence = (result.count / result.total) * 100;
    if (confidence < MIN_CONFIDENCE) return null;

    // Skip if same as current
    if (result.winner === profile.currentTruckId) return null;

    return {
      driverId,
      suggestionType: profile.currentTruckId ? 'TRUCK_CHANGE' : 'NEW_ASSIGNMENT',
      loadCount: result.count,
      confidence: Math.round(confidence),
      suggestedTruckId: result.winner,
      currentTruckId: profile.currentTruckId,
    };
  }

  private computeTrailerSuggestion(
    driverId: string,
    loads: LoadRow[],
    profile: DriverProfile
  ): EquipmentSuggestion | null {
    const result = this.frequency(loads.map(l => l.trailerId).filter(Boolean) as string[]);
    if (!result || result.count < MIN_LOAD_COUNT) return null;

    const confidence = (result.count / result.total) * 100;
    if (confidence < MIN_CONFIDENCE) return null;

    if (result.winner === profile.currentTrailerId) return null;

    return {
      driverId,
      suggestionType: profile.currentTrailerId ? 'TRAILER_CHANGE' : 'NEW_ASSIGNMENT',
      loadCount: result.count,
      confidence: Math.round(confidence),
      suggestedTrailerId: result.winner,
      currentTrailerId: profile.currentTrailerId,
    };
  }

  private computeDispatcherSuggestion(
    driverId: string,
    loads: LoadRow[],
    profile: DriverProfile
  ): EquipmentSuggestion | null {
    // Only suggest if driver has no assigned dispatcher
    if (profile.assignedDispatcherId) return null;

    const result = this.frequency(loads.map(l => l.dispatcherId).filter(Boolean) as string[]);
    if (!result || result.count < MIN_LOAD_COUNT) return null;

    const confidence = (result.count / result.total) * 100;
    if (confidence < MIN_CONFIDENCE) return null;

    return {
      driverId,
      suggestionType: 'DISPATCHER_LINK',
      loadCount: result.count,
      confidence: Math.round(confidence),
      suggestedDispatcherId: result.winner,
      currentDispatcherId: null,
    };
  }

  private frequency(items: string[]): { winner: string; count: number; total: number } | null {
    if (items.length === 0) return null;

    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let winner = '';
    let maxCount = 0;
    for (const [key, count] of counts) {
      if (count > maxCount) {
        winner = key;
        maxCount = count;
      }
    }

    return { winner, count: maxCount, total: items.length };
  }

  private async persistSuggestions(
    importBatchId: string,
    suggestions: EquipmentSuggestion[]
  ): Promise<void> {
    for (const s of suggestions) {
      await this.prisma.importAssignmentSuggestion.upsert({
        where: {
          // Use a composite lookup via findFirst + create/update pattern
          // since we don't have a unique constraint on batch+driver+type
          id: await this.findExistingId(importBatchId, s.driverId, s.suggestionType),
        },
        create: {
          companyId: this.companyId,
          importBatchId,
          suggestionType: s.suggestionType,
          driverId: s.driverId,
          loadCount: s.loadCount,
          confidence: s.confidence,
          suggestedTruckId: s.suggestedTruckId ?? null,
          currentTruckId: s.currentTruckId ?? null,
          suggestedTrailerId: s.suggestedTrailerId ?? null,
          currentTrailerId: s.currentTrailerId ?? null,
          suggestedDispatcherId: s.suggestedDispatcherId ?? null,
          currentDispatcherId: s.currentDispatcherId ?? null,
        },
        update: {
          loadCount: s.loadCount,
          confidence: s.confidence,
          suggestedTruckId: s.suggestedTruckId ?? null,
          suggestedTrailerId: s.suggestedTrailerId ?? null,
          suggestedDispatcherId: s.suggestedDispatcherId ?? null,
        },
      });
    }
  }

  private async findExistingId(
    importBatchId: string,
    driverId: string,
    suggestionType: string
  ): Promise<string> {
    const existing = await this.prisma.importAssignmentSuggestion.findFirst({
      where: { importBatchId, driverId, suggestionType: suggestionType as any, status: 'PENDING' },
      select: { id: true },
    });
    // Return existing ID or a placeholder that won't match (forces create path)
    return existing?.id || 'non-existent-id';
  }
}
