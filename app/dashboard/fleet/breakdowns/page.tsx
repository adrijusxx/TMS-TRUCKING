'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ActiveBreakdownsDashboard from '@/components/fleet/ActiveBreakdownsDashboard';
import BreakdownHistoryNew from '@/components/fleet/BreakdownHistoryNew';
import BreakdownHotspots from '@/components/fleet/BreakdownHotspots';
import BreakdownCostTracking from '@/components/fleet/BreakdownCostTracking';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertTriangle, History, MapPin, DollarSign } from 'lucide-react';

export default function FleetBreakdownsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'active';

  const handleTabChange = (value: string) => {
    if (value === 'active') {
      router.push('/dashboard/fleet/breakdowns');
    } else {
      router.push(`/dashboard/fleet/breakdowns?tab=${value}`);
    }
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
        ]}
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Breakdowns</h1>
        </div>
        
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="hotspots" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Hotspots</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Cost Tracking</span>
              <span className="sm:hidden">Costs</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <ActiveBreakdownsDashboard />
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <BreakdownHistoryNew />
          </TabsContent>
          
          <TabsContent value="hotspots" className="mt-4">
            <BreakdownHotspots />
          </TabsContent>
          
          <TabsContent value="costs" className="mt-4">
            <BreakdownCostTracking />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

