/**
 * Samsara Fault Sync Task
 *
 * Runs hourly via CronScheduler. Pulls fault codes from Samsara for all
 * active companies that have trucks linked to Samsara, and syncs them into
 * TruckFaultHistory for the Fleet maintenance dashboard.
 */

import { prisma } from '@/lib/prisma';
import { FleetMaintenanceService } from '@/lib/services/FleetMaintenanceService';

interface FaultsTaskResult {
  companiesProcessed: number;
  companiesSkipped: number;
  results: Array<{
    company: string;
    trucksProcessed: number;
    trucksSkipped: number;
    newFaults: number;
    resolvedFaults: number;
  }>;
}

export async function runSamsaraFaultsTask(): Promise<FaultsTaskResult> {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const result: FaultsTaskResult = {
    companiesProcessed: 0,
    companiesSkipped: 0,
    results: [],
  };

  for (const company of companies) {
    try {
      const service = new FleetMaintenanceService(company.id);
      const syncResult = await service.syncFaultCodes();

      if (syncResult.trucksProcessed > 0 || syncResult.trucksSkipped > 0) {
        result.companiesProcessed++;
        result.results.push({
          company: company.name,
          trucksProcessed: syncResult.trucksProcessed,
          trucksSkipped: syncResult.trucksSkipped ?? 0,
          newFaults: syncResult.newFaults,
          resolvedFaults: syncResult.resolvedFaults,
        });
      } else {
        result.companiesSkipped++;
      }
    } catch {
      result.companiesSkipped++;
    }
  }

  return result;
}
