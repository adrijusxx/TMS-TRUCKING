/**
 * LoadAnomalyDetector
 * 
 * Analyzes load data for suspicious values and potential errors.
 */
export class LoadAnomalyDetector {
    /**
     * Detect anomalies in a load's data
     */
    static detect(load: {
        revenue: number;
        driverPay: number;
        profit: number;
        totalMiles: number;
        weight: number;
    }, updateExisting: boolean = false): { suspicious: boolean; anomalies: string[] } {
        const anomalies: string[] = [];
        const { revenue, driverPay, profit, totalMiles, weight } = load;

        if (revenue < 0) anomalies.push('Negative Revenue');
        if (driverPay > revenue && revenue > 0) anomalies.push('Pay exceeds Revenue');
        if (profit < 0 && !updateExisting) anomalies.push('Negative Profit');
        if (totalMiles > 4000) anomalies.push('High Mileage (>4000)');
        if (weight > 50000) anomalies.push('Overweight (>50,000 lbs)');
        if (revenue > 20000) anomalies.push('Extremely High Revenue');

        // Detection of "Driver Pay = Revenue" error
        if (revenue > 0 && driverPay === revenue) {
            anomalies.push('Suspicious: Driver Pay exactly matches Revenue');
        }

        return {
            suspicious: anomalies.length > 0,
            anomalies
        };
    }

    /**
     * Attempts to self-correct obvious data entry errors
     */
    static autoCorrect(load: {
        revenue: number;
        driverPay: number;
        totalMiles: number;
        defaultPayRate: number
    }): { driverPay: number; corrected: boolean } {
        if (load.revenue > 0 && load.driverPay === load.revenue) {
            if (load.totalMiles > 0) {
                const correctedPay = Math.round(load.totalMiles * load.defaultPayRate * 100) / 100;
                return { driverPay: correctedPay, corrected: true };
            }
        }
        return { driverPay: load.driverPay, corrected: false };
    }
}
