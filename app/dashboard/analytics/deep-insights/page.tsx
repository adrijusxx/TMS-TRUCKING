'use client';

import DeepInsightsContainer from '@/components/analytics/DeepInsightsContainer';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DeepInsightsPage() {
    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: 'Analytics & Reports', href: '/dashboard/analytics' },
                { label: 'Deep Insights' }
            ]} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Deep Insights</h1>
                <p className="text-muted-foreground mt-2">
                    AI-driven analysis of your fleet's staffing, operational costs, and strategic opportunities.
                </p>
            </div>

            <DeepInsightsContainer />
        </div>
    );
}
