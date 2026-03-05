'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import SalaryNavigation, { type SalaryTabId } from './SalaryNavigation';

// Lazy load tab components for better performance
const PendingSettlementsTab = React.lazy(() => import('./tabs/PendingSettlementsTab'));
const SalaryBatchesTab = React.lazy(() => import('./tabs/SalaryBatchesTab'));
const DriverStatementsTab = React.lazy(() => import('./tabs/DriverStatementsTab'));
const SalaryReportTab = React.lazy(() => import('./tabs/SalaryReportTab'));
const DriverBalancesTab = React.lazy(() => import('./tabs/DriverBalancesTab'));
const DispatcherSalaryTab = React.lazy(() => import('./tabs/DispatcherSalaryTab'));
const DriverOneTimeChargesTab = React.lazy(() => import('./tabs/DriverOneTimeChargesTab'));
const DriverScheduledPaymentsTab = React.lazy(() => import('./tabs/DriverScheduledPaymentsTab'));
const SalaryHelpTab = React.lazy(() => import('./tabs/SalaryHelpTab'));

export default function SalaryModuleLayout() {
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('tab') as SalaryTabId) || 'batches';

    const TAB_CONTENT: Record<SalaryTabId, React.ReactNode> = {
        pending: <PendingSettlementsTab />,
        batches: <SalaryBatchesTab />,
        statements: <DriverStatementsTab />,
        report: <SalaryReportTab />,
        balances: <DriverBalancesTab />,
        dispatcher: <DispatcherSalaryTab />,
        charges: <DriverOneTimeChargesTab />,
        scheduled: <DriverScheduledPaymentsTab />,
        help: <SalaryHelpTab />,
    };

    return (
        <PageShell>
            <div className="w-full">
                <SalaryNavigation />
                <div className="mt-4">
                    <React.Suspense fallback={<TabContentSkeleton />}>
                        {TAB_CONTENT[activeTab] ?? <SalaryBatchesTab />}
                    </React.Suspense>
                </div>
            </div>
        </PageShell>
    );
}

function TabContentSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-2">
                <div className="h-9 w-20 bg-muted rounded" />
                <div className="h-9 w-32 bg-muted rounded" />
                <div className="flex-1" />
                <div className="h-9 w-20 bg-muted rounded" />
                <div className="h-9 w-24 bg-muted rounded" />
            </div>
            <div className="border rounded-lg">
                <div className="h-12 bg-muted/50 border-b" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 border-b last:border-b-0 flex items-center px-4 gap-4">
                        <div className="h-4 w-4 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="flex-1" />
                        <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
