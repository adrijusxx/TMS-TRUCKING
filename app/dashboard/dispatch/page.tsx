'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, UserCircle, Navigation, Map } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';

// Lazy load tab components
const LoadBoard = React.lazy(() => import('@/components/loads/LoadBoard'));
const DispatchViewClient = React.lazy(() => import('@/components/dispatch-view/DispatchViewClient'));
const OperationsCenter = React.lazy(() => import('@/components/operations/OperationsCenter'));

const DISPATCH_TABS = [
  { id: 'board', label: 'Week Board', icon: LayoutGrid },
  { id: 'my-dispatch', label: 'My Dispatch', icon: UserCircle },
  { id: 'operations', label: 'Operations', icon: Navigation },
] as const;

type DispatchTabId = typeof DISPATCH_TABS[number]['id'];

function TabSkeleton() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function DispatchHubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get('view') as DispatchTabId) || 'board';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Dispatch</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-auto p-0 bg-transparent border-b border-border rounded-none w-full justify-start gap-0">
            {DISPATCH_TABS.map((tab) => {
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

          <React.Suspense fallback={<TabSkeleton />}>
            <TabsContent value="board" className="mt-4">
              <LoadBoard />
            </TabsContent>
            <TabsContent value="my-dispatch" className="mt-4">
              <DispatchViewClient />
            </TabsContent>
            <TabsContent value="operations" className="mt-4">
              <OperationsCenter />
            </TabsContent>
          </React.Suspense>
        </Tabs>
      </div>
    </PageTransition>
  );
}
