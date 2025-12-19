'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, AlertTriangle, Plus, MessageSquare, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import FleetAnalyticsSummary from './FleetAnalyticsSummary';
import OpenCasesTable from './OpenCasesTable';
import CommunicationHub from './CommunicationHub';
import CreateCaseModal from './CreateCaseModal';
import { apiUrl } from '@/lib/utils';

interface ActiveBreakdownsData {
  breakdowns: Array<{ id: string }>;
  stats: { total: number };
}

async function fetchActiveBreakdowns() {
  const response = await fetch(apiUrl('/api/fleet/breakdowns/active'));
  if (!response.ok) return { data: { stats: { total: 0 } } };
  return response.json();
}

export default function FleetDepartmentDashboard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: breakdownsData } = useQuery<{ success: boolean; data: ActiveBreakdownsData }>({
    queryKey: ['activeBreakdowns-count'],
    queryFn: fetchActiveBreakdowns,
    refetchInterval: 30000,
  });

  const openCasesCount = breakdownsData?.data?.stats?.total || 0;

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

      {/* Analytics Overview - Quick Stats at Top */}
      <CollapsibleSection
        title="Quick Stats"
        icon={<BarChart3 className="h-4 w-4" />}
        defaultOpen={true}
      >
        <FleetAnalyticsSummary />
      </CollapsibleSection>

      {/* Active Cases - Primary Focus */}
      <CollapsibleSection
        title="Active Cases"
        icon={<AlertTriangle className="h-4 w-4" />}
        badge={openCasesCount > 0 ? openCasesCount : undefined}
        badgeVariant={openCasesCount > 0 ? 'destructive' : 'secondary'}
        defaultOpen={true}
      >
        <OpenCasesTable searchQuery={searchQuery} />
      </CollapsibleSection>

      {/* Communication Hub */}
      <CollapsibleSection
        title="Communication Hub"
        icon={<MessageSquare className="h-4 w-4" />}
        defaultOpen={true}
      >
        <CommunicationHub />
      </CollapsibleSection>

      {/* Create Case Modal */}
      <CreateCaseModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}

