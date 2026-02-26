/**
 * IFTA Constants & Types
 *
 * Shared tax rates, state name lookups, and interfaces for IFTA calculations.
 */

import type { StateMileage } from '@/lib/services/RoutingService';

// Current IFTA tax rates by state (dollars per gallon)
// These should be updated quarterly from IFTA Inc.
export const IFTA_TAX_RATES: Record<string, number> = {
  AL: 0.29, AK: 0.0895, AZ: 0.26, AR: 0.285, CA: 0.68,
  CO: 0.22, CT: 0.45, DE: 0.22, FL: 0.35, GA: 0.326,
  HI: 0.17, ID: 0.32, IL: 0.467, IN: 0.54, IA: 0.30,
  KS: 0.26, KY: 0.247, LA: 0.20, ME: 0.312, MD: 0.365,
  MA: 0.24, MI: 0.262, MN: 0.285, MS: 0.18, MO: 0.17,
  MT: 0.2975, NE: 0.294, NV: 0.23, NH: 0.222, NJ: 0.414,
  NM: 0.18, NY: 0.3235, NC: 0.38, ND: 0.23, OH: 0.385,
  OK: 0.19, OR: 0.36, PA: 0.576, RI: 0.34, SC: 0.26,
  SD: 0.28, TN: 0.26, TX: 0.20, UT: 0.314, VT: 0.31,
  VA: 0.282, WA: 0.494, WV: 0.357, WI: 0.309, WY: 0.24,
  DC: 0.235,
};

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

export function getStateName(abbr: string): string {
  return STATE_NAMES[abbr] || abbr;
}

// --- Interfaces ---

export interface IFTALoadData {
  loadId: string;
  loadNumber: string;
  pickupCity: string;
  pickupState: string;
  pickupZip?: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip?: string;
  stops?: Array<{ city: string; state: string; zipCode?: string; sequence: number }>;
  driverId: string;
  truckId?: string;
  deliveredAt?: Date;
}

export interface IFTACalculationResult {
  loadId: string;
  totalMiles: number;
  stateMileages: Array<StateMileage & { taxRate: number; tax: number }>;
  totalTax: number;
  routePolyline: string | null;
  calculatedAt: Date;
}

export interface IFTAStateBreakdownItem {
  state: string;
  stateName: string;
  miles: number;
  taxableMiles: number;
  taxRate: number;
  taxDue: number;
  taxPaid: number;
  netTax: number;
}

export interface IFTAQuarterReport {
  companyId: string;
  quarter: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  stateBreakdown: IFTAStateBreakdownItem[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
  loadsIncluded: number;
}

export interface IFTATruckBreakdownEntry {
  truckId: string;
  truckNumber: string;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  loadsIncluded: number;
  stateBreakdown: IFTAStateBreakdownItem[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
}

export interface IFTAByTruckReport {
  companyId: string;
  quarter: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  trucks: IFTATruckBreakdownEntry[];
  fleetTotalMiles: number;
  fleetTotalTaxDue: number;
  fleetTotalTaxPaid: number;
  fleetNetTaxDue: number;
}

export interface IFTADriverBreakdownEntry {
  driverId: string;
  driverName: string;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  loadsIncluded: number;
  stateBreakdown: IFTAStateBreakdownItem[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
}

export interface IFTAByDriverReport {
  companyId: string;
  quarter: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  drivers: IFTADriverBreakdownEntry[];
  fleetTotalMiles: number;
  fleetTotalTaxDue: number;
  fleetTotalTaxPaid: number;
  fleetNetTaxDue: number;
}
