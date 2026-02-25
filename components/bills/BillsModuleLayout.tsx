'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, Receipt, Users, Wallet, CreditCard, Clock } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

// Lazy load tab components
const VendorBillBatchesTab = React.lazy(() => import('./tabs/VendorBillBatchesTab'));
const VendorBillsTab = React.lazy(() => import('./tabs/VendorBillsTab'));
const VendorStatementsTab = React.lazy(() => import('./tabs/VendorStatementsTab'));
const VendorBalancesTab = React.lazy(() => import('./tabs/VendorBalancesTab'));
const VendorOneTimeChargesTab = React.lazy(() => import('./tabs/VendorOneTimeChargesTab'));
const VendorScheduledPaymentsTab = React.lazy(() => import('./tabs/VendorScheduledPaymentsTab'));

const BILLS_TABS = [
  { id: 'batches', label: 'Bills Batch', icon: FileText },
  { id: 'bills', label: 'Bills', icon: Receipt },
  { id: 'statements', label: 'Bills Statements', icon: Users },
  { id: 'balances', label: 'Vendor Balances', icon: Wallet },
  { id: 'charges', label: 'One Time Charges', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled Payments', icon: Clock },
] as const;

type BillsTabId = (typeof BILLS_TABS)[number]['id'];

export default function BillsModuleLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get('tab') as BillsTabId) || 'batches';

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
          {BILLS_TABS.map((tab) => {
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
        </div>

        <React.Suspense fallback={<TabContentSkeleton />}>
          <TabsContent value="batches" className="mt-4">
            <VendorBillBatchesTab />
          </TabsContent>
          <TabsContent value="bills" className="mt-4">
            <VendorBillsTab />
          </TabsContent>
          <TabsContent value="statements" className="mt-4">
            <VendorStatementsTab />
          </TabsContent>
          <TabsContent value="balances" className="mt-4">
            <VendorBalancesTab />
          </TabsContent>
          <TabsContent value="charges" className="mt-4">
            <VendorOneTimeChargesTab />
          </TabsContent>
          <TabsContent value="scheduled" className="mt-4">
            <VendorScheduledPaymentsTab />
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
