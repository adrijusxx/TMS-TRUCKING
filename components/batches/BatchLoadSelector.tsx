'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { Loader2, Calendar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface LoadItem {
  id: string;
  loadNumber: string;
  status: string;
  revenue: number;
  pickupCity: string | null;
  pickupState: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryDate: string | null;
  pickupDate: string | null;
  customer: { id: string; name: string; customerNumber: string };
  driver?: { driverNumber: string; user: { firstName: string; lastName: string } } | null;
  mcNumber?: { id: string; number: string; companyName: string } | null;
}

interface DocStatus {
  hasPOD: boolean;
  hasBOL: boolean;
  hasRateCon: boolean;
}

interface BatchLoadSelectorProps {
  selectedLoadIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function getDefaultDateRange() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  return {
    startDate: weekAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
}

async function fetchAvailableLoads(startDate: string, endDate: string, mcNumberId: string) {
  const params = new URLSearchParams({ limit: '500', status: 'DELIVERED' });
  params.append('status', 'INVOICED');
  if (startDate) params.set('deliveryDateStart', startDate);
  if (endDate) params.set('deliveryDateEnd', endDate);
  if (mcNumberId) params.set('mcNumberIdFilter', mcNumberId);

  const response = await fetch(apiUrl(`/api/loads?${params}`));
  if (!response.ok) throw new Error('Failed to fetch loads');
  const loadData = await response.json();

  // Exclude already-batched loads
  const batchesRes = await fetch(apiUrl('/api/batches?limit=1000'));
  const batchedLoadIds = new Set<string>();
  if (batchesRes.ok) {
    const batchesData = await batchesRes.json();
    if (batchesData.success && batchesData.data) {
      for (const batch of batchesData.data) {
        for (const item of batch.items || []) {
          const inv = item.invoice;
          if (inv?.loadId) batchedLoadIds.add(inv.loadId);
          if (inv?.loadIds && Array.isArray(inv.loadIds)) {
            for (const lid of inv.loadIds) batchedLoadIds.add(lid);
          }
        }
      }
    }
  }
  if (loadData.success && loadData.data) {
    loadData.data = loadData.data.filter((l: LoadItem) => !batchedLoadIds.has(l.id));
  }
  return loadData;
}

async function fetchDocStatus(loadIds: string[]): Promise<Record<string, DocStatus>> {
  if (loadIds.length === 0) return {};
  const response = await fetch(apiUrl(`/api/loads/document-status?loadIds=${loadIds.join(',')}`));
  if (!response.ok) return {};
  const result = await response.json();
  return result.data || {};
}

const statusColors: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INVOICED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  BILLED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

function DocStatusCell({ status }: { status?: DocStatus }) {
  if (!status) return <span className="text-muted-foreground text-xs">...</span>;

  const missing: string[] = [];
  if (!status.hasPOD) missing.push('POD');
  if (!status.hasBOL) missing.push('BOL');
  if (!status.hasRateCon) missing.push('Rate Con');

  if (missing.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </TooltipTrigger>
        <TooltipContent>All documents available</TooltipContent>
      </Tooltip>
    );
  }

  const Icon = missing.includes('POD') ? XCircle : AlertTriangle;
  const color = missing.includes('POD') ? 'text-red-500' : 'text-yellow-500';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className={`text-xs ${color}`}>{missing.length}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-0.5">
          <div className="font-medium">Missing documents:</div>
          {missing.map((m) => <div key={m}>- {m}</div>)}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function BatchLoadSelector({
  selectedLoadIds,
  onSelectionChange,
}: BatchLoadSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [mcNumberId, setMcNumberId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['available-loads-for-batch', startDate, endDate, mcNumberId],
    queryFn: () => fetchAvailableLoads(startDate, endDate, mcNumberId),
  });

  const loads: LoadItem[] = data?.data || [];
  const totalFromApi: number = data?.meta?.totalCount || data?.meta?.total || loads.length;
  const isTruncated = totalFromApi > loads.length;
  const loadIds = useMemo(() => loads.map((l) => l.id), [loads]);

  // Fetch document status for all visible loads
  const { data: docStatusData } = useQuery({
    queryKey: ['load-doc-status', loadIds.join(',')],
    queryFn: () => fetchDocStatus(loadIds),
    enabled: loadIds.length > 0,
  });
  const docStatus: Record<string, DocStatus> = docStatusData || {};

  const filteredLoads = loads.filter((load) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      load.loadNumber.toLowerCase().includes(q) ||
      load.customer.name.toLowerCase().includes(q) ||
      (load.driver?.user?.firstName || '').toLowerCase().includes(q) ||
      (load.driver?.user?.lastName || '').toLowerCase().includes(q) ||
      (load.mcNumber?.number || '').toLowerCase().includes(q)
    );
  });

  const handleToggle = (id: string) => {
    if (selectedLoadIds.includes(id)) {
      onSelectionChange(selectedLoadIds.filter((lid) => lid !== id));
    } else {
      onSelectionChange([...selectedLoadIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLoadIds.length === filteredLoads.length && filteredLoads.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredLoads.map((l) => l.id));
    }
  };

  const selectedTotal = filteredLoads
    .filter((l) => selectedLoadIds.includes(l.id))
    .reduce((sum, l) => sum + (l.revenue || 0), 0);

  // Count loads with missing docs
  const missingDocsCount = filteredLoads.filter((l) => {
    const ds = docStatus[l.id];
    return ds && (!ds.hasPOD || !ds.hasBOL || !ds.hasRateCon);
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 h-full flex flex-col min-h-0">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 flex-shrink-0">
          <div className="w-[200px]">
            <McNumberSelector
              value={mcNumberId}
              onValueChange={(v) => { setMcNumberId(v); onSelectionChange([]); }}
              label="MC Number"
              required={false}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date From</Label>
            <div className="relative">
              <Input
                type="date" value={startDate}
                onChange={(e) => { setStartDate(e.target.value); onSelectionChange([]); }}
                className="w-[150px] h-9 pr-8"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date To</Label>
            <div className="relative">
              <Input
                type="date" value={endDate}
                onChange={(e) => { setEndDate(e.target.value); onSelectionChange([]); }}
                className="w-[150px] h-9 pr-8"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 min-w-[180px] space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Load #, customer, driver..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Select all + summary */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={filteredLoads.length > 0 && selectedLoadIds.length === filteredLoads.length}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">
                Select all available loads ({filteredLoads.length})
              </Label>
            </div>
            {missingDocsCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {missingDocsCount} load(s) missing documents
              </div>
            )}
          </div>
          {selectedLoadIds.length > 0 && (
            <div className="text-sm font-medium">
              {selectedLoadIds.length} selected — {formatCurrency(selectedTotal)}
            </div>
          )}
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Showing {loads.length} of {totalFromApi} loads. Narrow your date range or use filters to see all results.
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Load #</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>MC Number</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Del. Date</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No available loads for the selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoads.map((load) => {
                    const isSelected = selectedLoadIds.includes(load.id);
                    const driverName = load.driver?.user
                      ? `${load.driver.user.firstName} ${load.driver.user.lastName}`.trim()
                      : '-';

                    return (
                      <TableRow key={load.id} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox checked={isSelected} onCheckedChange={() => handleToggle(load.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{load.loadNumber}</TableCell>
                        <TableCell className="text-sm">{driverName}</TableCell>
                        <TableCell className="text-sm">{load.customer.name}</TableCell>
                        <TableCell className="text-sm">{load.mcNumber?.number || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(load.revenue)}</TableCell>
                        <TableCell className="text-sm">
                          {load.pickupCity && load.pickupState ? `${load.pickupCity}, ${load.pickupState}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {load.deliveryCity && load.deliveryState ? `${load.deliveryCity}, ${load.deliveryState}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{load.deliveryDate ? formatDate(load.deliveryDate) : '-'}</TableCell>
                        <TableCell>
                          <DocStatusCell status={docStatus[load.id]} />
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[load.status] || 'bg-gray-100 text-gray-800'}>
                            {load.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
