'use client';

import RouteEfficiencyAnalysis from '@/components/analytics/RouteEfficiencyAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function LaneAnalysisPage() {
    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: 'Analytics & Reports', href: '/dashboard/analytics' },
                { label: 'Lane Analysis' }
            ]} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Lane Analysis</h1>
                <p className="text-muted-foreground mt-2">
                    Identify profitable routes and optimize dispatch strategies.
                </p>
            </div>

            <RouteEfficiencyAnalysis />
        </div>
    );
}
