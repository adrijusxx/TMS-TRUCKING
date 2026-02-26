'use client';

import React, { useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl, formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Library, AlertTriangle } from 'lucide-react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface TrainingData {
  id: string;
  trainingType: string;
  trainingName: string;
  trainingDate: string | Date;
  completionDate?: string | Date | null;
  expiryDate?: string | Date | null;
  status: string;
  completed: boolean;
  passed?: boolean | null;
  provider?: string | null;
  score?: number | null;
  driver: { id: string; user: { firstName: string; lastName: string } };
}

interface TrainingMaterial {
  id: string;
  title: string;
  description?: string | null;
  materialType: string;
  createdAt: string | Date;
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const typeLabels: Record<string, string> = {
  DEFENSIVE_DRIVING: 'Defensive Driving',
  HAZMAT: 'Hazmat',
  HOURS_OF_SERVICE: 'Hours of Service',
  ELD_TRAINING: 'ELD Training',
  FIRST_AID: 'First Aid',
};

function createTrainingColumns(): ExtendedColumnDef<TrainingData>[] {
  return [
    { id: 'trainingDate', accessorKey: 'trainingDate', header: 'Date', cell: ({ row }) => formatDate(row.original.trainingDate), defaultVisible: true, required: true },
    { id: 'driver', header: 'Driver', cell: ({ row }) => `${row.original.driver.user.firstName} ${row.original.driver.user.lastName}`, defaultVisible: true },
    { id: 'trainingName', accessorKey: 'trainingName', header: 'Training', cell: ({ row }) => <span className="font-medium">{row.original.trainingName}</span>, defaultVisible: true },
    { id: 'trainingType', accessorKey: 'trainingType', header: 'Type', cell: ({ row }) => <Badge variant="outline">{typeLabels[row.original.trainingType] ?? row.original.trainingType}</Badge>, defaultVisible: true },
    { id: 'status', accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="outline" className={statusColors[row.original.status] || ''}>{row.original.status}</Badge>, defaultVisible: true },
    { id: 'score', header: 'Score', cell: ({ row }) => row.original.score != null ? `${row.original.score}%` : <span className="text-muted-foreground">-</span>, defaultVisible: true },
    { id: 'expiryDate', header: 'Expires', cell: ({ row }) => row.original.expiryDate ? formatDate(row.original.expiryDate) : <span className="text-muted-foreground">-</span>, defaultVisible: true },
    { id: 'provider', accessorKey: 'provider', header: 'Provider', cell: ({ row }) => row.original.provider ?? <span className="text-muted-foreground">-</span>, defaultVisible: false },
  ];
}

export default function TrainingCenter() {
  const trainingColumns = useMemo(() => createTrainingColumns(), []);

  const fetchTrainings = useCallback(async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
    const qp = new URLSearchParams();
    if (params.page) qp.set('page', String(params.page));
    if (params.pageSize) qp.set('limit', String(params.pageSize));
    const res = await fetch(apiUrl(`/api/safety/trainings?${qp.toString()}`));
    if (!res.ok) throw new Error('Failed to fetch trainings');
    const json = await res.json();
    return { data: json.data as TrainingData[], meta: json.meta };
  }, []);

  const { data: materialsData } = useQuery({
    queryKey: ['safety-training-materials'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/training-materials?limit=50'));
      if (!res.ok) throw new Error('Failed to fetch materials');
      const json = await res.json();
      return json.data as TrainingMaterial[];
    },
  });

  const materials = materialsData ?? [];

  const { data: expiringData } = useQuery({
    queryKey: ['safety-trainings-expiring'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/trainings?status=COMPLETED&limit=50'));
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return (json.data as TrainingData[]).filter(
        (t) => t.expiryDate && new Date(t.expiryDate) <= thirtyDays
      );
    },
  });

  const expiring = expiringData ?? [];

  return (
    <Tabs defaultValue="records" className="space-y-4">
      <TabsList>
        <TabsTrigger value="records"><BookOpen className="h-4 w-4 mr-2" />Records</TabsTrigger>
        <TabsTrigger value="materials"><Library className="h-4 w-4 mr-2" />Materials</TabsTrigger>
        <TabsTrigger value="expiring"><AlertTriangle className="h-4 w-4 mr-2" />Expiring ({expiring.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="records">
        <DataTableWrapper<TrainingData>
          config={{ entityType: 'safety-trainings', columns: trainingColumns, defaultSort: [{ id: 'trainingDate', desc: true }], defaultPageSize: 20, enableColumnVisibility: true }}
          fetchData={fetchTrainings}
          emptyMessage="No training records found"
        />
      </TabsContent>

      <TabsContent value="materials" className="space-y-4">
        {materials.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No training materials uploaded yet</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {materials.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{m.title}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{m.description || 'No description'}</p>
                  <Badge variant="outline" className="mt-2">{m.materialType}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="expiring" className="space-y-4">
        {expiring.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No trainings expiring within 30 days</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {expiring.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-medium">{t.driver.user.firstName} {t.driver.user.lastName}</span>
                    <span className="text-muted-foreground"> - {t.trainingName}</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    Expires {formatDate(t.expiryDate!)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
