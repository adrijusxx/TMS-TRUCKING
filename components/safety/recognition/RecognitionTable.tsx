'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl, formatDate, formatCurrency } from '@/lib/utils';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Trophy, Target } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface RecognitionData {
  id: string;
  driverId: string;
  recognitionType: string;
  achievement: string;
  recognitionDate: string | Date;
  awardAmount?: number | null;
  announced: boolean;
  driver: { id: string; user: { firstName: string; lastName: string } };
}

interface CampaignData {
  id: string;
  campaignName: string;
  campaignType: string;
  goal?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  participants: Array<{
    id: string;
    pointsEarned: number;
    achievement?: string | null;
    bonusAmount?: number | null;
    driver: { id: string; user: { firstName: string; lastName: string } };
  }>;
}

const typeLabels: Record<string, string> = {
  YEARS_WITHOUT_ACCIDENT: 'Years Without Accident',
  MILESTONE_MILES: 'Milestone Miles',
  SAFETY_LEADERSHIP: 'Safety Leadership',
  OTHER: 'Other',
};

const campaignTypeLabels: Record<string, string> = {
  MILLION_MILE_CLUB: 'Million Mile Club',
  NO_PREVENTABLE_ACCIDENTS: 'No Preventable Accidents',
  BEST_PRE_TRIP_INSPECTION: 'Best Pre-Trip Inspection',
  OTHER: 'Other',
};

function createRecognitionColumns(): ExtendedColumnDef<RecognitionData>[] {
  return [
    { id: 'recognitionDate', accessorKey: 'recognitionDate', header: 'Date', cell: ({ row }) => formatDate(row.original.recognitionDate), defaultVisible: true, required: true },
    { id: 'driver', header: 'Driver', cell: ({ row }) => `${row.original.driver.user.firstName} ${row.original.driver.user.lastName}`, defaultVisible: true },
    { id: 'recognitionType', accessorKey: 'recognitionType', header: 'Type', cell: ({ row }) => <Badge variant="outline">{typeLabels[row.original.recognitionType] ?? row.original.recognitionType}</Badge>, defaultVisible: true },
    { id: 'achievement', accessorKey: 'achievement', header: 'Achievement', cell: ({ row }) => row.original.achievement, defaultVisible: true },
    { id: 'awardAmount', header: 'Award', cell: ({ row }) => row.original.awardAmount ? formatCurrency(row.original.awardAmount) : <span className="text-muted-foreground">-</span>, defaultVisible: true },
    { id: 'announced', header: 'Announced', cell: ({ row }) => <Badge variant="outline" className={row.original.announced ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>{row.original.announced ? 'Yes' : 'No'}</Badge>, defaultVisible: true },
  ];
}

export default function RecognitionTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canManage = can('safety.recognition.manage');

  const recognitionColumns = useMemo(() => createRecognitionColumns(), []);

  const fetchRecognitions = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      const res = await fetch(apiUrl(`/api/safety/recognition?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch recognitions');
      const json = await res.json();
      return { data: json.data as RecognitionData[], meta: json.meta };
    },
    []
  );

  const { data: campaignsData } = useQuery({
    queryKey: ['safety-campaigns'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/campaigns?limit=50'));
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const json = await res.json();
      return json.data as CampaignData[];
    },
  });

  const campaigns = campaignsData ?? [];
  const activeCampaigns = campaigns.filter((c) => new Date(c.endDate) >= new Date());

  return (
    <Tabs defaultValue="recognitions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="recognitions"><Trophy className="h-4 w-4 mr-2" />Awards</TabsTrigger>
        <TabsTrigger value="campaigns"><Target className="h-4 w-4 mr-2" />Campaigns</TabsTrigger>
      </TabsList>

      <TabsContent value="recognitions" className="space-y-4">
        <DataTableWrapper<RecognitionData>
          config={{
            entityType: 'safety-recognitions',
            columns: recognitionColumns,
            defaultSort: [{ id: 'recognitionDate', desc: true }],
            defaultPageSize: 20,
            enableColumnVisibility: true,
          }}
          fetchData={fetchRecognitions}
          emptyMessage="No recognitions found"
        />
      </TabsContent>

      <TabsContent value="campaigns" className="space-y-4">
        {activeCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No active campaigns. {canManage && 'Create one to get started.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{campaign.campaignName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {campaignTypeLabels[campaign.campaignType] ?? campaign.campaignType} | {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </p>
                </CardHeader>
                <CardContent>
                  {campaign.goal && <p className="text-sm mb-3">{campaign.goal}</p>}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Leaderboard ({campaign.participants.length} participants)</p>
                    {campaign.participants.slice(0, 5).map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span>{idx + 1}. {p.driver.user.firstName} {p.driver.user.lastName}</span>
                        <Badge variant="outline">{p.pointsEarned} pts</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
