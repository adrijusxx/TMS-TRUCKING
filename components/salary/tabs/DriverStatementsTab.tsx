'use client';

import * as React from 'react';
import SettlementListNew from '@/components/settlements/SettlementListNew';

/**
 * DriverStatementsTab - Individual driver settlement statements
 * Reuses the existing SettlementListNew component for consistency
 */
export default function DriverStatementsTab() {
    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
                View and manage individual driver settlement statements. Click on a row to view details.
            </div>
            <SettlementListNew />
        </div>
    );
}
