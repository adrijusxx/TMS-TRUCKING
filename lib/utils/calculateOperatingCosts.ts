/**
 * Pure utility to estimate operating costs for a load based on miles and SystemConfig metrics.
 * No database access — all values must be passed in.
 */

export interface OperatingCostParams {
  totalMiles: number | null | undefined;
  transitDays?: number | null;        // If null, estimated as ceil(totalMiles / 500)
  mpg: number | null | undefined;     // Truck-specific, fleet avg, or industry default
  fuelPrice: number | null | undefined;
  maintenanceCpm: number | null | undefined;
  fixedCostPerDay: number | null | undefined;
}

export interface OperatingCostResult {
  estimatedFuelCost: number;
  estimatedMaintCost: number;
  estimatedFixedCost: number;
  estimatedOpCost: number;
}

const MILES_PER_TRANSIT_DAY = 500;

export function calculateOperatingCosts(params: OperatingCostParams): OperatingCostResult {
  const miles = params.totalMiles ?? 0;
  const mpg = params.mpg && params.mpg > 0 ? params.mpg : 0;
  const fuelPrice = params.fuelPrice ?? 0;
  const maintenanceCpm = params.maintenanceCpm ?? 0;
  const fixedCostPerDay = params.fixedCostPerDay ?? 0;

  const estimatedFuelCost = mpg > 0 && miles > 0
    ? round2((miles / mpg) * fuelPrice)
    : 0;

  const estimatedMaintCost = miles > 0
    ? round2(miles * maintenanceCpm)
    : 0;

  const transitDays = params.transitDays && params.transitDays > 0
    ? params.transitDays
    : miles > 0
      ? Math.ceil(miles / MILES_PER_TRANSIT_DAY)
      : 0;

  const estimatedFixedCost = transitDays > 0
    ? round2(transitDays * fixedCostPerDay)
    : 0;

  const estimatedOpCost = round2(estimatedFuelCost + estimatedMaintCost + estimatedFixedCost);

  return { estimatedFuelCost, estimatedMaintCost, estimatedFixedCost, estimatedOpCost };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
