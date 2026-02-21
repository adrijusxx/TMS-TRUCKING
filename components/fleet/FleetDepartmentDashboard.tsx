'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, LayoutDashboard, AlertTriangle, BarChart3, Users, History, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FleetStatsCards from './shared/FleetStatsCards';
import BreakdownsDataTable from './shared/BreakdownsDataTable';
import CreateCaseModal from './CreateCaseModal';
import BreakdownHotspots from './BreakdownHotspots';
import BreakdownCostTracking from './BreakdownCostTracking';
import OnCallSchedule from './OnCallSchedule';
import PreventiveMaintenance from './PreventiveMaintenance';
import MaintenanceList from '@/components/maintenance/MaintenanceList';
import TelegramFullWidget from '@/components/telegram/TelegramFullWidget';
import TelegramReviewQueue from '@/components/telegram/TelegramReviewQueue';
import { Search, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';


export default function FleetDepartmentDashboard() {
  const { can } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reviewStats } = useQuery({
    queryKey: ['telegram-review-stats'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/telegram/review-queue?status=PENDING&pageSize=0'));
      if (!res.ok) return null;
      return (await res.json()).data?.counts;
    },
    refetchInterval: 30000,
    enabled: can('fleet.communications'),
  });



  const handleTabChange = (value: string) => {
    if (value === 'overview') {
      router.push('/dashboard/fleet');
    } else {
      router.push(`/dashboard/fleet?tab=${value}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section with Search and Create Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases by #, truck, driver, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create New Case
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          {can('fleet.communications') && (
            <TabsTrigger value="review" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Review Queue</span>
              {(reviewStats?.pending ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-[10px]">{reviewStats.pending}</Badge>
              )}
            </TabsTrigger>
          )}
          {can('maintenance.view') && (
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
          )}
          {can('analytics.view') && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview — Two-panel layout */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Panel: Telegram Messages */}
            {can('fleet.communications') && (
              <div>
                <TelegramFullWidget />
              </div>
            )}

            {/* Right Panel: Active Cases */}
            <div className={can('fleet.communications') ? '' : 'lg:col-span-2'}>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Active & Recent Cases</h3>
                <BreakdownsDataTable
                  mode="full"
                  searchQuery={searchQuery}
                  showFilters={true}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Review Queue */}
        <TabsContent value="review" className="mt-4">
          <TelegramReviewQueue />
        </TabsContent>

        {/* Tab 3: Maintenance */}
        <TabsContent value="maintenance" className="mt-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Maintenance History & Records
              </h3>
            </div>
            <MaintenanceList />
          </div>
        </TabsContent>

        {/* Tab 3: Analytics */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {/* Stats Cards */}
          <FleetStatsCards
            variant="full"
            enabledCards={['openCases', 'totalCost', 'avgResolution', 'fleetHealth']}
          />

          {/* Analytics Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Breakdown Hotspots</h3>
              <BreakdownHotspots />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Cost Tracking</h3>
              <BreakdownCostTracking />
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Team & Assignments */}
        <TabsContent value="team" className="mt-4 space-y-4">
          {/* Stats Cards */}
          <FleetStatsCards
            variant="compact"
            enabledCards={['openCases', 'unreadMessages']}
          />

          {/* On-Call Schedule */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">On-Call Schedule</h3>
            <OnCallSchedule />
          </div>

          {/* Team Assignments - Using the table filtered by assigned cases */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Active Assignments</h3>
            <BreakdownsDataTable
              mode="full"
              searchQuery={searchQuery}
              showFilters={true}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Case Modal */}
      <CreateCaseModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div >
  );
}
