/**
 * Enhanced Settlement Generation with Detailed Validation Feedback
 * 
 * Shows detailed toast notifications for each load validation issue
 */

import { toast } from 'sonner'; // or your toast library
import { validateLoadsForSettlement, type SettlementValidationConfig } from '@/lib/validations/settlement-validation';

interface GenerateSettlementParams {
    driverId: string;
    periodStart: Date;
    periodEnd: Date;
    validationConfig: SettlementValidationConfig;
}

export async function generateSettlementWithValidation(params: GenerateSettlementParams) {
    const { driverId, periodStart, periodEnd, validationConfig } = params;

    try {
        // 1. Fetch loads for the driver in the period
        const response = await fetch(
            `/api/settlements/preview?driverId=${driverId}&start=${periodStart.toISOString()}&end=${periodEnd.toISOString()}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch loads');
        }

        const { loads } = await response.json();

        // 2. Validate loads
        const validation = validateLoadsForSettlement(loads, validationConfig, {
            start: periodStart,
            end: periodEnd,
        });

        // 3. Show detailed feedback
        if (validation.invalidLoads.length > 0) {
            // Show error toast for each invalid load with details
            validation.invalidLoads.forEach((result) => {
                const errorMessages = result.errors.map((e) => `• ${e.message}`).join('\n');

                toast.error(`Load ${result.load.loadNumber} - Cannot Settle`, {
                    description: (
                        <div className= "space-y-2" >
                        <p className="font-semibold"> Missing Requirements: </p>
                            < div className="text-sm whitespace-pre-line" > { errorMessages } </div>
                            < p className="text-xs text-muted-foreground mt-2" >
                            Fix these issues to include this load in the settlement.
              </p>
                                </div>
          ),
                    duration: 10000, // Show for 10 seconds
                        action: {
                    label: 'View Load',
                        onClick: () => window.open(`/dashboard/loads/${result.load.loadNumber}`, '_blank'),
          },
            });
        });

        // Show summary toast
        toast.error('Settlement Validation Failed', {
            description: `${validation.invalidLoads.length} of ${validation.summary.total} loads failed validation. See details above.`,
        });
    }

    // 4. Show warnings (non-blocking)
    if (validation.loadsWithWarnings.length > 0) {
        validation.loadsWithWarnings.forEach((result) => {
            const warningMessages = result.warnings.map((w) => `• ${w.message}`).join('\n');

            toast.warning(`Load ${result.load.loadNumber} - Warnings`, {
                description: (
                    <div className= "space-y-2" >
                    <div className="text-sm whitespace-pre-line"> { warningMessages } </div>
                        < p className="text-xs text-muted-foreground mt-2" >
                        Settlement will proceed, but consider addressing these warnings.
              </p>
                            </div>
          ),
                duration: 8000,
        });
    });
}

// 5. If no valid loads, stop here
if (validation.validLoads.length === 0) {
    toast.error('No Valid Loads', {
        description: 'No loads meet the settlement requirements for this period.',
    });
    return null;
}

// 6. Show success summary
toast.success('Loads Validated', {
    description: `${validation.validLoads.length} of ${validation.summary.total} loads are ready for settlement.`,
});

// 7. Generate settlement with valid loads only
const settlementResponse = await fetch('/api/settlements/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        driverId,
        periodStart,
        periodEnd,
        loadIds: validation.validLoads.map((l) => l.id),
    }),
});

if (!settlementResponse.ok) {
    throw new Error('Failed to generate settlement');
}

const settlement = await settlementResponse.json();

toast.success('Settlement Generated', {
    description: `Settlement ${settlement.settlementNumber} created successfully.`,
});

return settlement;
  } catch (error: any) {
    toast.error('Error', {
        description: error.message || 'Failed to generate settlement',
    });
    return null;
}
}

/**
 * Batch Settlement Generation with Detailed Feedback
 */
export async function generateBatchSettlementsWithValidation(
    drivers: { id: string; name: string }[],
    periodStart: Date,
    periodEnd: Date,
    validationConfig: SettlementValidationConfig
) {
    const results = {
        successful: [] as any[],
        failed: [] as any[],
        partiallyValid: [] as any[],
    };

    for (const driver of drivers) {
        try {
            const settlement = await generateSettlementWithValidation({
                driverId: driver.id,
                periodStart,
                periodEnd,
                validationConfig,
            });

            if (settlement) {
                results.successful.push({ driver, settlement });
            } else {
                results.failed.push({ driver, reason: 'No valid loads' });
            }
        } catch (error: any) {
            results.failed.push({ driver, reason: error.message });
        }
    }

    // Show batch summary
    toast.success('Batch Settlement Complete', {
        description: (
            <div className= "space-y-1" >
            <p>✅ Successful: { results.successful.length } </p>
                <p>❌ Failed: { results.failed.length } </p>
                    </div>
    ),
  });

return results;
}
