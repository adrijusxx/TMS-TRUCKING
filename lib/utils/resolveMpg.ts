/**
 * Resolves the best available MPG value for a load's fuel cost estimation.
 * Cascade: truck-specific → fleet average (SystemConfig) → industry default.
 */

export type MpgSource = 'truck' | 'fleet' | 'default';

export interface MpgResolution {
  mpg: number;
  source: MpgSource;
}

const INDUSTRY_DEFAULT_MPG = 6.5; // Class 8 truck standard (5.5–7.5 range)

export function resolveMpg(
  truckMpg?: number | null,
  fleetMpg?: number | null,
  industryDefault: number = INDUSTRY_DEFAULT_MPG,
): MpgResolution {
  if (truckMpg && truckMpg > 0) {
    return { mpg: truckMpg, source: 'truck' };
  }
  if (fleetMpg && fleetMpg > 0) {
    return { mpg: fleetMpg, source: 'fleet' };
  }
  return { mpg: industryDefault, source: 'default' };
}
