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
  // Always use the base payRate for tariff display
  // The tariff is what the driver is paid, not what they've earned
  return formatBaseTariff(payType, payRate);
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

