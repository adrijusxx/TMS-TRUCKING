'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, Users, BarChart3, Wallet, Clock, UserCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';

// Lazy load tab components for better performance
const PendingSettlementsTab = React.lazy(() => import('./tabs/PendingSettlementsTab'));
const SalaryBatchesTab = React.lazy(() => import('./tabs/SalaryBatchesTab'));
const DriverStatementsTab = React.lazy(() => import('./tabs/DriverStatementsTab'));
const SalaryReportTab = React.lazy(() => import('./tabs/SalaryReportTab'));
const DriverBalancesTab = React.lazy(() => import('./tabs/DriverBalancesTab'));
const DispatcherSalaryTab = React.lazy(() => import('./tabs/DispatcherSalaryTab'));

const SALARY_TABS = [
    { id: 'batches', label: 'Batches', icon: FileText },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'statements', label: 'All Settlements', icon: Users },
    { id: 'report', label: 'Reports', icon: BarChart3 },
    { id: 'balances', label: 'Balances', icon: Wallet },
    { id: 'dispatcher', label: 'Dispatcher Salary', icon: UserCheck },
] as const;

type SalaryTabId = typeof SALARY_TABS[number]['id'];

export default function SalaryModuleLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeTab = (searchParams.get('tab') as SalaryTabId) || 'batches';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <PageShell>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center border-b border-border">
                    <TabsList className="h-auto p-0 bg-transparent rounded-none flex-1 justify-start gap-0">
                    {SALARY_TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className={cn(
                                    'relative h-10 px-4 rounded-none border-b-2 border-transparent',
                                    'data-[state=active]:border-primary data-[state=active]:bg-transparent',
                                    'data-[state=active]:shadow-none data-[state=active]:text-primary',
                                    'hover:text-foreground/80 transition-colors',
                                    'text-sm font-medium text-muted-foreground'
                                )}
                            >
                                <Icon className="h-4 w-4 mr-2" />
                                {tab.label}
                            </TabsTrigger>
                        );
                    })}
                    </TabsList>
                    <Link href="/dashboard/settlements/generate" className="shrink-0 ml-auto pl-4">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Settlement
                        </Button>
                    </Link>
                </div>

                <React.Suspense fallback={<TabContentSkeleton />}>
                    <TabsContent value="pending" className="mt-4">
                        <PendingSettlementsTab />
                    </TabsContent>
                    <TabsContent value="batches" className="mt-4">
                        <SalaryBatchesTab />
                    </TabsContent>
                    <TabsContent value="statements" className="mt-4">
                        <DriverStatementsTab />
                    </TabsContent>
                    <TabsContent value="report" className="mt-4">
                        <SalaryReportTab />
                    </TabsContent>
                    <TabsContent value="balances" className="mt-4">
                        <DriverBalancesTab />
                    </TabsContent>
                    <TabsContent value="dispatcher" className="mt-4">
                        <DispatcherSalaryTab />
                    </TabsContent>
                </React.Suspense>
            </Tabs>
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
