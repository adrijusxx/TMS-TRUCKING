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
  const { payType, payRate } = driver;
  const { totalMiles, loadedMiles, emptyMiles, revenue } = load;

  switch (payType) {
    case 'PER_MILE': {
      // Use total miles if available, otherwise sum loaded + empty miles
      const miles = totalMiles || (loadedMiles || 0) + (emptyMiles || 0);
      return miles > 0 ? miles * payRate : 0;
    }

    case 'PER_LOAD': {
      // Fixed rate per load
      return payRate;
    }

    case 'PERCENTAGE': {
      // Percentage of revenue
      const loadRevenue = revenue || 0;
      return loadRevenue * (payRate / 100);
    }

    case 'HOURLY': {
      // Estimate hours based on miles (rough estimate: 50 mph average)
      const miles = totalMiles || (loadedMiles || 0) + (emptyMiles || 0);
      const estimatedHours = miles > 0 ? miles / 50 : 10; // Default 10 hours if no miles
      return estimatedHours * payRate;
    }

    default:
      return 0;
  }
}

