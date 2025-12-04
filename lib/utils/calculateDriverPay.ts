import { PayType } from '@prisma/client';

interface DriverPayData {
  payType: PayType;
  payRate: number;
}

interface LoadPayData {
  totalMiles?: number | null;
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  revenue?: number | null;
}

interface DriverPayResult {
  amount: number;
  calculationMethod: PayType;
  inputs: {
    payRate: number;
    miles?: number;
    revenue?: number;
    estimatedHours?: number;
  };
  formula: string;
  warnings: string[];
}

/**
 * Calculate driver pay based on driver's pay type and rate, and load details
 * 
 * @param driver - Driver's pay information
 * @param load - Load's financial and mileage information
 * @returns Calculated driver pay amount
 */
export function calculateDriverPay(
  driver: DriverPayData,
  load: LoadPayData
): number {
  const result = calculateDriverPayWithDetails(driver, load);
  return result.amount;
}

/**
 * Calculate driver pay with detailed breakdown for audit trail
 * Returns full calculation details including formula and inputs
 * 
 * @param driver - Driver's pay information
 * @param load - Load's financial and mileage information
 * @returns Detailed calculation result
 */
export function calculateDriverPayWithDetails(
  driver: DriverPayData,
  load: LoadPayData
): DriverPayResult {
  const { payType, payRate } = driver;
  const { totalMiles, loadedMiles, emptyMiles, revenue } = load;
  const warnings: string[] = [];

  // Validate inputs
  if (payRate < 0) {
    warnings.push('Pay rate is negative - using 0');
  }

  const effectivePayRate = Math.max(0, payRate);

  switch (payType) {
    case 'PER_MILE': {
      // Use total miles if available, otherwise sum loaded + empty miles
      let miles = totalMiles || 0;
      let milesSource = 'totalMiles';
      
      if (!miles || miles === 0) {
        const loaded = loadedMiles || 0;
        const empty = emptyMiles || 0;
        miles = loaded + empty;
        milesSource = 'loadedMiles + emptyMiles';
      }
      
      if (miles === 0) {
        warnings.push('No mileage data available - driver pay calculation requires miles for PER_MILE pay type');
      }
      
      const amount = miles > 0 ? miles * effectivePayRate : 0;
      
      return {
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        calculationMethod: payType,
        inputs: {
          payRate: effectivePayRate,
          miles,
        },
        formula: `${miles} miles × $${effectivePayRate.toFixed(4)}/mile = $${amount.toFixed(2)}`,
        warnings,
      };
    }

    case 'PER_LOAD': {
      // Fixed rate per load
      return {
        amount: effectivePayRate,
        calculationMethod: payType,
        inputs: {
          payRate: effectivePayRate,
        },
        formula: `Flat rate per load = $${effectivePayRate.toFixed(2)}`,
        warnings,
      };
    }

    case 'PERCENTAGE': {
      // Percentage of revenue (commonly used for Owner Operators)
      const loadRevenue = revenue || 0;
      
      if (loadRevenue === 0) {
        warnings.push('No revenue data available - driver pay calculation requires revenue for PERCENTAGE pay type');
      }
      
      if (effectivePayRate > 100) {
        warnings.push(`Pay rate percentage (${effectivePayRate}%) exceeds 100% - driver will receive more than load revenue`);
      }
      
      const amount = loadRevenue * (effectivePayRate / 100);
      
      return {
        amount: Math.round(amount * 100) / 100,
        calculationMethod: payType,
        inputs: {
          payRate: effectivePayRate,
          revenue: loadRevenue,
        },
        formula: `$${loadRevenue.toFixed(2)} × ${effectivePayRate}% = $${amount.toFixed(2)}`,
        warnings,
      };
    }

    case 'HOURLY': {
      // Estimate hours based on miles (rough estimate: 50 mph average)
      let miles = totalMiles || 0;
      if (!miles) {
        miles = (loadedMiles || 0) + (emptyMiles || 0);
      }
      
      // Default to 10 hours if no mileage data
      let estimatedHours = 10;
      if (miles > 0) {
        estimatedHours = miles / 50; // Assuming 50 mph average
      } else {
        warnings.push('No mileage data - using default 10 hours estimate. Consider providing actual hours.');
      }
      
      const amount = estimatedHours * effectivePayRate;
      
      return {
        amount: Math.round(amount * 100) / 100,
        calculationMethod: payType,
        inputs: {
          payRate: effectivePayRate,
          miles: miles > 0 ? miles : undefined,
          estimatedHours,
        },
        formula: `${estimatedHours.toFixed(1)} hours × $${effectivePayRate.toFixed(2)}/hour = $${amount.toFixed(2)}`,
        warnings,
      };
    }

    case 'WEEKLY': {
      // Fixed weekly rate - no load-specific calculation needed
      // This is typically calculated at settlement level, not per load
      return {
        amount: effectivePayRate,
        calculationMethod: payType,
        inputs: {
          payRate: effectivePayRate,
        },
        formula: `Weekly flat rate = $${effectivePayRate.toFixed(2)}`,
        warnings: ['WEEKLY pay is typically calculated at settlement level, not per load'],
      };
    }

    default:
      return {
        amount: 0,
        calculationMethod: payType,
        inputs: { payRate: 0 },
        formula: 'Unknown pay type - no calculation performed',
        warnings: [`Unknown pay type: ${payType}`],
      };
  }
}

/**
 * Validate driver pay calculation inputs
 * Returns validation errors and warnings
 */
export function validateDriverPayInputs(
  driver: DriverPayData | null,
  load: LoadPayData
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!driver) {
    errors.push('Driver pay information is required');
    return { valid: false, errors, warnings };
  }

  if (!driver.payType) {
    errors.push('Driver pay type is required');
  }

  if (driver.payRate === null || driver.payRate === undefined) {
    errors.push('Driver pay rate is required');
  } else if (driver.payRate < 0) {
    errors.push('Driver pay rate cannot be negative');
  }

  // Check load data based on pay type
  if (driver.payType === 'PER_MILE' || driver.payType === 'HOURLY') {
    const hasMiles = (load.totalMiles && load.totalMiles > 0) ||
                     (load.loadedMiles && load.loadedMiles > 0) ||
                     (load.emptyMiles && load.emptyMiles > 0);
    if (!hasMiles) {
      warnings.push('No mileage data - driver pay calculation may be inaccurate');
    }
  }

  if (driver.payType === 'PERCENTAGE') {
    if (!load.revenue || load.revenue <= 0) {
      errors.push('Revenue is required for percentage-based driver pay');
    }
  }

  if (driver.payType === 'WEEKLY') {
    warnings.push('WEEKLY pay type is calculated at settlement level, not per load');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate net driver pay after deductions
 */
export function calculateNetDriverPay(
  grossPay: number,
  deductions: {
    fuelAdvance?: number;
    escrow?: number;
    insurance?: number;
    other?: number;
  }
): {
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  breakdown: Array<{ name: string; amount: number }>;
} {
  const breakdown: Array<{ name: string; amount: number }> = [];
  let totalDeductions = 0;

  if (deductions.fuelAdvance && deductions.fuelAdvance > 0) {
    breakdown.push({ name: 'Fuel Advance', amount: deductions.fuelAdvance });
    totalDeductions += deductions.fuelAdvance;
  }

  if (deductions.escrow && deductions.escrow > 0) {
    breakdown.push({ name: 'Escrow', amount: deductions.escrow });
    totalDeductions += deductions.escrow;
  }

  if (deductions.insurance && deductions.insurance > 0) {
    breakdown.push({ name: 'Insurance', amount: deductions.insurance });
    totalDeductions += deductions.insurance;
  }

  if (deductions.other && deductions.other > 0) {
    breakdown.push({ name: 'Other Deductions', amount: deductions.other });
    totalDeductions += deductions.other;
  }

  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    breakdown,
  };
}
