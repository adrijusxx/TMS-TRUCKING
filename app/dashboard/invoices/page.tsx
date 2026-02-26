'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, Package, Clock, CheckCircle2, AlertTriangle, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';

const InvoiceListNew = React.lazy(() => import('@/components/invoices/InvoiceListNew'));
const BatchListNew = React.lazy(() => import('@/components/batches/BatchListNew'));
const AgingReport = React.lazy(() => import('@/components/invoices/AgingReport'));
const ReconciliationTab = React.lazy(() => import('@/components/invoices/ReconciliationTab'));
const WatchdogList = React.lazy(() => import('@/components/watchdogs/WatchdogList'));
const InvoiceReports = React.lazy(() => import('@/components/invoices/InvoiceReports'));

const INVOICE_TABS = [
  { id: 'batches', label: 'Batches', icon: Package },
  { id: 'all', label: 'All Invoices', icon: FileText },
  { id: 'aging', label: 'Aging', icon: Clock },
  { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle2 },
  { id: 'watchdogs', label: 'Watchdogs', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
] as const;

type InvoiceTabId = (typeof INVOICE_TABS)[number]['id'];

export default function InvoicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get('tab') as InvoiceTabId) || 'batches';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'batches') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <PageShell>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center border-b border-border">
          <TabsList className="h-auto p-0 bg-transparent rounded-none flex-1 justify-start gap-0">
          {INVOICE_TABS.map((tab) => {
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
          <Link href="/dashboard/invoices/generate" className="shrink-0 ml-auto pl-4">
            <Button size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </Link>
        </div>

        <React.Suspense fallback={<TabContentSkeleton />}>
          <TabsContent value="all" className="mt-4">
            <InvoiceListNew />
          </TabsContent>
          <TabsContent value="batches" className="mt-4">
            <BatchListNew embedded />
          </TabsContent>
          <TabsContent value="aging" className="mt-4">
            <AgingReport />
          </TabsContent>
          <TabsContent value="reconciliation" className="mt-4">
            <ReconciliationTab />
          </TabsContent>
          <TabsContent value="watchdogs" className="mt-4">
            <WatchdogList />
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <InvoiceReports />
          </TabsContent>
        </React.Suspense>
      </Tabs>
    </PageShell>
  );
}

function TabContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse mt-4">
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
