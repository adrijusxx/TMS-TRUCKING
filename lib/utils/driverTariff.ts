import { PayType } from '@prisma/client';

interface Load {
  revenue: number;
  driverPay?: number | null;
  totalMiles?: number | null;
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  serviceFee?: number | null;
}

interface DriverTariffParams {
  payType: PayType;
  payRate: number;
  loads: Load[];
}

/**
 * Calculate driver tariff display string based on pay type, pay rate, and analytics from loads
 */
export function calculateDriverTariff({
  payType,
  payRate,
  loads,
}: DriverTariffParams): string {
  if (loads.length === 0) {
    // Return base tariff without analytics
    return formatBaseTariff(payType, payRate);
  }

  // Calculate from actual loads
  const totalMiles = loads.reduce(
    (sum, load) => sum + (load.totalMiles || load.loadedMiles || load.emptyMiles || 0),
    0
  );
  const totalRevenue = loads.reduce((sum, load) => sum + (load.revenue || 0), 0);
  const totalDriverPay = loads.reduce((sum, load) => sum + (load.driverPay || 0), 0);
  const totalServiceFee = loads.reduce((sum, load) => sum + (load.serviceFee || 0), 0);

  switch (payType) {
    case 'PER_MILE':
      // Calculate average per mile rate from actual loads
      if (totalMiles > 0 && totalDriverPay > 0) {
        const avgPerMile = totalDriverPay / totalMiles;
        // Check if there's a per-stop bonus
        const stopsCount = loads.length;
        const perStopBonus = totalServiceFee > 0 ? totalServiceFee / stopsCount : 0;
        
        if (perStopBonus > 0) {
          return `$${avgPerMile.toFixed(2)} per mile + $${perStopBonus.toFixed(0)} per stop`;
        }
        return `$${avgPerMile.toFixed(2)} per mile`;
      }
      return `$${payRate.toFixed(2)} per mile`;

    case 'PER_LOAD':
      // Calculate average per load
      if (loads.length > 0 && totalDriverPay > 0) {
        const avgPerLoad = totalDriverPay / loads.length;
        return `$${avgPerLoad.toFixed(2)} per load`;
      }
      return `$${payRate.toFixed(2)} per load`;

    case 'PERCENTAGE':
      // Calculate percentage from actual revenue
      if (totalRevenue > 0 && totalDriverPay > 0) {
        const actualPercentage = (totalDriverPay / totalRevenue) * 100;
        return `${actualPercentage.toFixed(0)}% from gross`;
      }
      return `${payRate.toFixed(0)}% from gross`;

    case 'HOURLY':
      // For hourly, we'd need hours worked which isn't in loads
      // Return base rate
      return `$${payRate.toFixed(2)}/hour`;

    default:
      return formatBaseTariff(payType, payRate);
  }
}

function formatBaseTariff(payType: PayType, payRate: number): string {
  switch (payType) {
    case 'PER_MILE':
      return `$${payRate.toFixed(2)} per mile`;
    case 'PER_LOAD':
      return `$${payRate.toFixed(2)} per load`;
    case 'PERCENTAGE':
      return `${payRate.toFixed(0)}% from gross`;
    case 'HOURLY':
      return `$${payRate.toFixed(2)}/hour`;
    default:
      return `$${payRate.toFixed(2)}`;
  }
}

