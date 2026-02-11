'use client';

import { SettlementReconciliationReport } from '@/components/reports/SettlementReconciliationReport';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function SettlementReconciliationPage() {
    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: 'Reports', href: '/dashboard/reports' },
                { label: 'Settlement Reconciliation', href: '/dashboard/reports/settlement-reconciliation' }
            ]} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settlement Reconciliation</h1>
                <p className="text-muted-foreground mt-2">
                    Compare invoiced revenue against driver settlements to ensure profitability and accuracy.
                </p>
            </div>

            <SettlementReconciliationReport />
        </div>
    );
}
