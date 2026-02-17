import { z } from 'zod';
import type { CreateLoadInput } from './main';

export const INVOICE_REQUIRED_FIELDS = ['loadNumber', 'customerId', 'revenue', 'weight'] as const;
export const SETTLEMENT_REQUIRED_FIELDS = ['loadNumber', 'driverId', 'totalMiles'] as const;

export interface AccountingValidationResult {
    isValid: boolean;
    canInvoice: boolean;
    canSettle: boolean;
    errors: string[];
    warnings: string[];
    missingForInvoice: string[];
    missingForSettlement: string[];
}

export function validateLoadForAccounting(data: Partial<CreateLoadInput> | any): AccountingValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingForInvoice: string[] = [];
    const missingForSettlement: string[] = [];

    if (!data.loadNumber) missingForInvoice.push('loadNumber');
    if (!data.customerId) {
        missingForInvoice.push('customerId');
        errors.push('Customer is required for invoicing');
    }
    if (data.revenue === undefined || data.revenue === null) {
        missingForInvoice.push('revenue');
        errors.push('Revenue is required for invoicing');
    } else if (data.revenue <= 0) {
        warnings.push('Revenue is $0 - invoice will have no amount');
    }
    if (!data.weight || data.weight <= 0) {
        missingForInvoice.push('weight');
        warnings.push('Weight is missing or zero - BOL validation may fail');
    }

    if (!data.loadNumber) missingForSettlement.push('loadNumber');
    if (!data.driverId) missingForSettlement.push('driverId');

    const hasMileage = (data.totalMiles && data.totalMiles > 0) || (data.loadedMiles && data.loadedMiles > 0);
    if (!hasMileage) {
        missingForSettlement.push('totalMiles');
        warnings.push('No mileage data - driver pay calculation may be inaccurate');
    }

    if (data.driverId && (!data.driverPay || data.driverPay <= 0)) {
        warnings.push('Driver is assigned but driver pay is $0 - verify pay calculation');
    }

    if (data.revenue && data.driverPay && data.driverPay > data.revenue) {
        warnings.push('Driver pay exceeds revenue - this load will be unprofitable');
    }

    if (data.fuelAdvance && data.fuelAdvance > 0) {
        if (data.driverPay && data.fuelAdvance > data.driverPay) {
            warnings.push('Fuel advance exceeds driver pay - driver will owe money');
        }
    }

    const canInvoice = missingForInvoice.filter(f => f !== 'loadNumber').length === 0;
    const canSettle = missingForSettlement.length === 0 || (missingForSettlement.length === 1 && missingForSettlement[0] === 'driverId');

    return {
        isValid: errors.length === 0,
        canInvoice,
        canSettle,
        errors,
        warnings,
        missingForInvoice,
        missingForSettlement,
    };
}

export const invoiceReadyLoadSchema = z.object({
    loadNumber: z.string().min(1, 'Load number is required'),
    customerId: z.string().min(1, 'Customer is required for invoicing'),
    revenue: z.number().positive('Revenue must be greater than 0 for invoicing'),
    weight: z.number().positive('Weight is required for BOL validation'),
    status: z.enum(['DELIVERED', 'INVOICED', 'PAID']).optional(),
});

export const settlementReadyLoadSchema = z.object({
    loadNumber: z.string().min(1, 'Load number is required'),
    driverId: z.string().min(1, 'Driver must be assigned for settlement'),
    totalMiles: z.number().positive('Miles are required for pay calculation').optional(),
    loadedMiles: z.number().nonnegative().optional(),
    driverPay: z.number().nonnegative('Driver pay cannot be negative').optional(),
    fuelAdvance: z.number().nonnegative().default(0),
});

export type InvoiceReadyLoad = z.infer<typeof invoiceReadyLoadSchema>;
export type SettlementReadyLoad = z.infer<typeof settlementReadyLoadSchema>;
