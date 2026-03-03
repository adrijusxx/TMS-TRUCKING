/**
 * Calculate driver pay for a load based on driver's pay settings.
 * Falls back to stored driverPay if available and valid.
 */
export function calculateLoadDriverPay(load: any, selectedDriver: any): number {
  if (!selectedDriver) return load.driverPay || 0;

  // If load already has stored driver pay, use it (with heuristic check)
  let shouldUseStored = load.driverPay && load.driverPay > 0;

  // Heuristic: If stored pay equals revenue exactly, and driver is PER_MILE or HOURLY,
  // it's likely an import default, so we should recalculate.
  if (
    shouldUseStored &&
    load.driverPay === load.revenue &&
    ['PER_MILE', 'HOURLY'].includes(selectedDriver.payType || '')
  ) {
    shouldUseStored = false;
  }

  if (shouldUseStored) return load.driverPay;

  if (!selectedDriver.payType || !selectedDriver.payRate) return 0;

  const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
  const revenue = load.revenue || 0;

  switch (selectedDriver.payType) {
    case 'PER_MILE':
      return miles * selectedDriver.payRate;
    case 'PER_LOAD':
      return selectedDriver.payRate;
    case 'PERCENTAGE':
      return revenue * (selectedDriver.payRate / 100);
    case 'HOURLY': {
      const estimatedHours = miles > 0 ? miles / 50 : 10;
      return estimatedHours * selectedDriver.payRate;
    }
    default:
      return 0;
  }
}
