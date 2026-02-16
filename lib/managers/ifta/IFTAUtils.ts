/**
 * IFTAUtils
 * 
 * Helper functions for IFTA period calculation.
 */
export class IFTAUtils {
    static getPeriodStart(periodType: 'QUARTER' | 'MONTH', year: number, quarter?: number, month?: number): Date {
        if (periodType === 'QUARTER' && quarter) {
            const monthMap: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9 };
            return new Date(year, monthMap[quarter], 1);
        } else if (periodType === 'MONTH' && month) {
            return new Date(year, month - 1, 1);
        }
        return new Date(year, 0, 1);
    }

    static getPeriodEnd(periodType: 'QUARTER' | 'MONTH', year: number, quarter?: number, month?: number): Date {
        if (periodType === 'QUARTER' && quarter) {
            const monthMap: Record<number, number> = { 1: 2, 2: 5, 3: 8, 4: 11 };
            return new Date(year, monthMap[quarter] + 1, 0);
        } else if (periodType === 'MONTH' && month) {
            return new Date(year, month, 0);
        }
        return new Date(year, 11, 31);
    }
}
