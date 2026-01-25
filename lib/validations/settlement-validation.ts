/**
 * Settlement Validation Configuration
 * 
 * Defines which validations are required for settlement generation.
 * Can be configured per company for strict vs. flexible accounting practices.
 */

export interface SettlementValidationConfig {
    // MANDATORY - Cannot be disabled
    requireDeliveredStatus: true; // Always true

    // OPTIONAL - Can be toggled by company
    requirePodUploaded: boolean;
    requireReadyForSettlementFlag: boolean;
    requireDeliveredDate: boolean;
    requireMcNumberMatch: boolean;

    // WARNINGS - Show warnings but allow settlement
    warnOnMissingPod: boolean;
    warnOnMissingBol: boolean;
    warnOnOldDeliveryDate: boolean; // Warn if delivered > 30 days ago
}

export const DEFAULT_VALIDATION_CONFIG: SettlementValidationConfig = {
    // Mandatory
    requireDeliveredStatus: true,

    // Optional validations (default: flexible mode)
    requirePodUploaded: false,
    requireReadyForSettlementFlag: false,
    requireDeliveredDate: false, // Default: Flexible
    requireMcNumberMatch: false, // Default: Flexible

    // Warnings
    warnOnMissingPod: true,
    warnOnMissingBol: true,
    warnOnOldDeliveryDate: true,
};

export const STRICT_VALIDATION_CONFIG: SettlementValidationConfig = {
    // Mandatory
    requireDeliveredStatus: true,

    // All validations enabled in strict mode
    requirePodUploaded: true,
    requireReadyForSettlementFlag: true,
    requireDeliveredDate: true,
    requireMcNumberMatch: true,

    // Warnings
    warnOnMissingPod: true,
    warnOnMissingBol: true,
    warnOnOldDeliveryDate: true,
};

export interface LoadValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    load: {
        loadNumber: string;
        status: string;
        deliveredAt: Date | null;
        podUploadedAt: Date | null;
        readyForSettlement: boolean;
    };
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error';
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'warning';
}

/**
 * Validates a load against the company's settlement validation config
 */
export function validateLoadForSettlement(
    load: any,
    config: SettlementValidationConfig,
    settlementPeriod: { start: Date; end: Date }
): LoadValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // MANDATORY: Status must be DELIVERED or higher
    const validStatuses = ['DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL', 'BILLING_HOLD'];
    if (!validStatuses.includes(load.status)) {
        errors.push({
            field: 'status',
            message: `Load status is "${load.status}". Must be DELIVERED, INVOICED, PAID, READY_TO_BILL, or BILLING_HOLD.`,
            severity: 'error',
        });
    }

    // OPTIONAL: POD uploaded
    if (config.requirePodUploaded && !load.podUploadedAt) {
        errors.push({
            field: 'podUploadedAt',
            message: 'POD (Proof of Delivery) has not been uploaded.',
            severity: 'error',
        });
    } else if (config.warnOnMissingPod && !load.podUploadedAt) {
        warnings.push({
            field: 'podUploadedAt',
            message: 'POD not uploaded. Consider uploading for better record keeping.',
            severity: 'warning',
        });
    }

    // OPTIONAL: Ready for settlement flag
    if (config.requireReadyForSettlementFlag && !load.readyForSettlement) {
        errors.push({
            field: 'readyForSettlement',
            message: 'Load is not marked as "Ready for Settlement".',
            severity: 'error',
        });
    }

    // OPTIONAL: Delivered date
    if (config.requireDeliveredDate && !load.deliveredAt) {
        errors.push({
            field: 'deliveredAt',
            message: 'Delivered date is not set.',
            severity: 'error',
        });
    }

    // Check if delivered date is within settlement period
    if (load.deliveredAt) {
        const deliveredDate = new Date(load.deliveredAt);
        if (deliveredDate < settlementPeriod.start || deliveredDate > settlementPeriod.end) {
            errors.push({
                field: 'deliveredAt',
                message: `Delivered date (${deliveredDate.toLocaleDateString()}) is outside settlement period (${settlementPeriod.start.toLocaleDateString()} - ${settlementPeriod.end.toLocaleDateString()}).`,
                severity: 'error',
            });
        }

        // Warn if delivery is old
        if (config.warnOnOldDeliveryDate) {
            const daysSinceDelivery = Math.floor(
                (new Date().getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceDelivery > 30) {
                warnings.push({
                    field: 'deliveredAt',
                    message: `Load was delivered ${daysSinceDelivery} days ago. Consider settling sooner.`,
                    severity: 'warning',
                });
            }
        }
    }

    // OPTIONAL: MC Number match
    if (config.requireMcNumberMatch && load.mcNumberId !== load.driver?.mcNumberId) {
        errors.push({
            field: 'mcNumberId',
            message: 'Load MC Number does not match driver MC Number.',
            severity: 'error',
        });
    }

    // Check for BOL
    if (config.warnOnMissingBol && !load.bolUploadedAt) {
        warnings.push({
            field: 'bolUploadedAt',
            message: 'BOL (Bill of Lading) not uploaded.',
            severity: 'warning',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        load: {
            loadNumber: load.loadNumber,
            status: load.status,
            deliveredAt: load.deliveredAt,
            podUploadedAt: load.podUploadedAt,
            readyForSettlement: load.readyForSettlement,
        },
    };
}

/**
 * Validates multiple loads and returns summary
 */
export function validateLoadsForSettlement(
    loads: any[],
    config: SettlementValidationConfig,
    settlementPeriod: { start: Date; end: Date }
): {
    validLoads: any[];
    invalidLoads: LoadValidationResult[];
    loadsWithWarnings: LoadValidationResult[];
    summary: {
        total: number;
        valid: number;
        invalid: number;
        warnings: number;
    };
} {
    const results = loads.map((load) =>
        validateLoadForSettlement(load, config, settlementPeriod)
    );

    const validLoads = results.filter((r) => r.isValid).map((r) => r.load);
    const invalidLoads = results.filter((r) => !r.isValid);
    const loadsWithWarnings = results.filter((r) => r.warnings.length > 0);

    return {
        validLoads,
        invalidLoads,
        loadsWithWarnings,
        summary: {
            total: loads.length,
            valid: validLoads.length,
            invalid: invalidLoads.length,
            warnings: loadsWithWarnings.length,
        },
    };
}
