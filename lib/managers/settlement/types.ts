import { LoadStatus } from '@prisma/client';

export interface SettlementGenerationParams {
    driverId: string;
    periodStart: Date;
    periodEnd: Date;
    settlementNumber?: string;
    notes?: string;
    salaryBatchId?: string;
    loadIds?: string[]; // Optional: restrict to specific loads
    forceIncludeNotReady?: boolean; // Optional: include loads not marked as ready
}

export interface DeductionItem {
    type: string;
    description: string;
    amount: number;
    reference?: string;
    metadata?: Record<string, any>;
}

export interface AdditionItem {
    type: string;
    description: string;
    amount: number;
    reference?: string;
    metadata?: Record<string, any>;
}

export interface SettlementCalculatedValues {
    grossPay: number;
    netPay: number;
    totalDeductions: number;
    totalAdditions: number;
    totalAdvances: number;
    additions: AdditionItem[];
    deductions: DeductionItem[];
    advances: any[];
    negativeBalanceDeduction: number;
    previousNegativeBalance: any | null;
    auditLog: SettlementAuditLog;
}

export interface SettlementAuditLog {
    version: string;
    calculatedAt: string;
    driverPayType: string;
    driverPayRate: number;
    loads: LoadAuditLog[];
    additions: AdditionItem[];
    deductions: DeductionItem[];
    advances: any[];
    grossPay: number;
    netPay: number;
}

export interface LoadAuditLog {
    loadId: string;
    loadNumber: string;
    deliveryDate: string;
    payType: string; // PER_MILE, PERCENTAGE, etc.
    payRate: number;
    loadedMiles: number;
    emptyMiles: number;
    totalMiles: number;
    revenue: number;
    fuelSurcharge: number; // For percentage pay
    calculatedPay: number;
    appliedRule?: string; // "Standard", "Minimum", "Hourly"
}
