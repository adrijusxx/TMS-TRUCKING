'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import InvoiceListNew from '@/components/invoices/InvoiceListNew';
import AgingReport from '@/components/invoices/AgingReport';
import WatchdogList from '@/components/watchdogs/WatchdogList';
import InvoiceReports from '@/components/invoices/InvoiceReports';
import ReconciliationPage from '@/app/dashboard/invoices/reconciliation/page';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Clock, AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react';

import InvoiceWorkflowInfo from '@/components/invoices/InvoiceWorkflowInfo';

export default function InvoicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'all';

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/invoices');
    } else {
      router.push(`/dashboard/invoices?tab=${value}`);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Invoices', href: '/dashboard/invoices' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
        </div>

        <InvoiceWorkflowInfo />

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">All Invoices</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="aging" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Aging</span>
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Reconciliation</span>
              <span className="sm:hidden">Reconcile</span>
            </TabsTrigger>
            <TabsTrigger value="watchdogs" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Watchdogs</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <InvoiceListNew />
          </TabsContent>

          <TabsContent value="aging" className="mt-4">
            <AgingReport />
          </TabsContent>

          <TabsContent value="reconciliation" className="mt-4">
            <ReconciliationPage />
          </TabsContent>

          <TabsContent value="watchdogs" className="mt-4">
            <WatchdogList />
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <InvoiceReports />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

