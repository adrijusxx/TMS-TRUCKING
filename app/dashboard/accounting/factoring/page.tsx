'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { TrendingUp, Building2 } from 'lucide-react';
import FactoringDashboard from '@/components/factoring/FactoringDashboard';
import FactoringCompanyListNew from '@/components/factoring/FactoringCompanyListNew';

const FACTORING_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'companies', label: 'Companies', icon: Building2 },
] as const;

type FactoringTabId = typeof FACTORING_TABS[number]['id'];

/**
 * Consolidated Factoring Page
 * Combines Factoring Dashboard + Factoring Companies in tabs
 */
export default function FactoringPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get('tab') as FactoringTabId) || 'dashboard';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Factoring' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Factoring</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="h-auto p-0 bg-transparent border-b border-border rounded-none w-full justify-start gap-0">
          {FACTORING_TABS.map((tab) => {
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

        <TabsContent value="dashboard" className="mt-4">
          <FactoringDashboard />
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <FactoringCompanyListNew />
        </TabsContent>
      </Tabs>
    </div>
  );
}
