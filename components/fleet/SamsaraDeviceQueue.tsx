'use client';

/**
 * Samsara Device Queue Component
 * 
 * Displays pending Samsara devices for review with approve/link/reject actions.
 * Compact table design with inline actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  RefreshCw, Truck, Container, Check, X, Link, MoreHorizontal,
  AlertTriangle, Clock, CheckCircle2, CheckSquare, Square
} from 'lucide-react';
import { apiUrl, cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface QueueItem {
  id: string;
  samsaraId: string;
  deviceType: 'TRUCK' | 'TRAILER';
  name: string;
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  status: string;
  matchedRecordId?: string;
  matchedType?: string;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewedBy?: { firstName: string; lastName: string };
}

interface QueueResponse {
  success: boolean;
  data: {
    items: QueueItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    counts: {
      pending: number;
      approved: number;
      linked: number;
      rejected: number;
    };
  };
}

interface LinkDialogState {
  open: boolean;
  item: QueueItem | null;
  recordId: string;
  recordType: 'TRUCK' | 'TRAILER';
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchQueue(status: string): Promise<QueueResponse['data']> {
  const res = await fetch(apiUrl(`/api/fleet/device-queue?status=${status}`));
  if (!res.ok) throw new Error('Failed to fetch device queue');
  const data = await res.json();
  return data.data;
}

async function triggerSync(): Promise<void> {
  const res = await fetch(apiUrl('/api/fleet/samsara-sync'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'devices' }),
  });
  if (!res.ok) throw new Error('Failed to trigger sync');
}

async function performAction(
  action: 'approve' | 'link' | 'reject',
  queueId: string,
  additionalData?: any
): Promise<void> {
  const res = await fetch(apiUrl('/api/fleet/device-queue'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, queueId, ...additionalData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Action failed');
  }
}

// ============================================
// COMPONENT
// ============================================

export default function SamsaraDeviceQueue() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({
    open: false,
    item: null,
    recordId: '',
    recordType: 'TRUCK',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['device-queue', statusFilter],
    queryFn: () => fetchQueue(statusFilter),
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      toast.success('Sync started - refreshing queue...');
      setTimeout(() => refetch(), 2000);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, queueId, data }: { action: string; queueId: string; data?: any }) =>
      performAction(action as any, queueId, data),
    onSuccess: (_, variables) => {
      toast.success(`Device ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['device-queue'] });
      setSelectedIds(new Set()); // Clear selection after action
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (data?.items) {
      setSelectedIds(new Set(data.items.map(item => item.id)));
    }
  };

  const selectAllByType = (type: 'TRUCK' | 'TRAILER') => {
    if (data?.items) {
      const filtered = data.items.filter(item => item.deviceType === type);
      setSelectedIds(new Set(filtered.map(item => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleApprove = (item: QueueItem) => {
    actionMutation.mutate({
      action: 'approve',
      queueId: item.id,
      data: {
        additionalData: {
          truckNumber: item.name,
          trailerNumber: item.name,
        },
      },
    });
  };

  const handleReject = (item: QueueItem) => {
    actionMutation.mutate({
      action: 'reject',
      queueId: item.id,
      data: { reason: 'Not needed in TMS' },
    });
  };

  const handleLinkSubmit = () => {
    if (!linkDialog.item || !linkDialog.recordId) return;
    actionMutation.mutate({
      action: 'link',
      queueId: linkDialog.item.id,
      data: {
        recordId: linkDialog.recordId,
        recordType: linkDialog.recordType,
      },
    });
    setLinkDialog({ open: false, item: null, recordId: '', recordType: 'TRUCK' });
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = data?.items.filter(item => selectedIds.has(item.id)) || [];
    
    const total = selectedItems.length;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    toast.loading(`Processing ${total} device(s)...`);

    // Process sequentially to avoid race conditions
    for (const item of selectedItems) {
      try {
        await performAction('approve', item.id, {
          additionalData: {
            truckNumber: item.name,
            trailerNumber: item.name,
          },
        });
        succeeded++;
      } catch (err: any) {
        failed++;
        errors.push(`${item.name}: ${err.message}`);
        console.warn(`[Bulk Approve] Failed for ${item.name}:`, err.message);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['device-queue'] });
    setSelectedIds(new Set());

    if (failed === 0) {
      toast.success(`Successfully processed ${succeeded} device(s)`);
    } else if (succeeded > 0) {
      toast.warning(`Processed ${succeeded}/${total} devices. ${failed} had errors.`);
    } else {
      toast.error(`Failed to process devices: ${errors[0] || 'Unknown error'}`);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = data?.items.filter(item => selectedIds.has(item.id)) || [];
    
    const total = selectedItems.length;
    let succeeded = 0;
    let failed = 0;

    toast.loading(`Rejecting ${total} device(s)...`);

    // Process sequentially
    for (const item of selectedItems) {
      try {
        await performAction('reject', item.id, { reason: 'Bulk rejected - not needed in TMS' });
        succeeded++;
      } catch (err: any) {
        failed++;
        console.warn(`[Bulk Reject] Failed for ${item.name}:`, err.message);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['device-queue'] });
    setSelectedIds(new Set());

    if (failed === 0) {
      toast.success(`Successfully rejected ${succeeded} device(s)`);
    } else {
      toast.warning(`Rejected ${succeeded}/${total} devices. ${failed} had errors.`);
    }
  };

  const counts = data?.counts || { pending: 0, approved: 0, linked: 0, rejected: 0 };

  return (
    <Card className="border">
      <CardHeader className="py-3 px-4 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Samsara Device Queue</CardTitle>
            {counts.pending > 0 && (
              <Badge variant="secondary" className="text-xs h-5 bg-amber-100 text-amber-700">
                {counts.pending} pending
              </Badge>
            )}
            {selectedIds.size > 0 && (
              <Badge variant="secondary" className="text-xs h-5 bg-blue-100 text-blue-700">
                {selectedIds.size} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="LINKED">Linked</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', syncMutation.isPending && 'animate-spin')} />
              Sync
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {statusFilter === 'PENDING' && data?.items && data.items.length > 0 && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={selectAll}>
                  Select All ({data.items.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => selectAllByType('TRUCK')}>
                  Select All Trucks ({data.items.filter(i => i.deviceType === 'TRUCK').length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => selectAllByType('TRAILER')}>
                  Select All Trailers ({data.items.filter(i => i.deviceType === 'TRAILER').length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearSelection}>
                  Clear Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleBulkApprove}
                  disabled={actionMutation.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Approve ({selectedIds.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleBulkReject}
                  disabled={actionMutation.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Reject ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Status summary */}
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b text-xs">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span className="font-medium">{counts.pending}</span> pending
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span className="font-medium">{counts.approved + counts.linked}</span> processed
          </span>
          <span className="flex items-center gap-1">
            <X className="h-3 w-3 text-red-600" />
            <span className="font-medium">{counts.rejected}</span> rejected
          </span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Failed to load queue
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No devices in queue
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                {statusFilter === 'PENDING' && (
                  <TableHead className="h-8 py-1 w-8"></TableHead>
                )}
                <TableHead className="h-8 py-1">Device</TableHead>
                <TableHead className="h-8 py-1">Type</TableHead>
                <TableHead className="h-8 py-1">VIN</TableHead>
                <TableHead className="h-8 py-1">Details</TableHead>
                <TableHead className="h-8 py-1">Status</TableHead>
                <TableHead className="h-8 py-1 w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map(item => (
                <TableRow key={item.id} className="text-xs">
                  {statusFilter === 'PENDING' && (
                    <TableCell className="py-2">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell className="py-2 font-medium">{item.name}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {item.deviceType === 'TRUCK' ? (
                        <><Truck className="h-2.5 w-2.5 mr-1" /> Truck</>
                      ) : (
                        <><Container className="h-2.5 w-2.5 mr-1" /> Trailer</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 font-mono text-[10px]">
                    {item.vin?.slice(0, 11) || '—'}
                  </TableCell>
                  <TableCell className="py-2">
                    {item.make && item.model ? (
                      <span>{item.year} {item.make} {item.model}</span>
                    ) : item.licensePlate ? (
                      <span>Plate: {item.licensePlate}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] h-5',
                        item.status === 'PENDING' && 'bg-amber-100 text-amber-700',
                        item.status === 'APPROVED' && 'bg-green-100 text-green-700',
                        item.status === 'LINKED' && 'bg-blue-100 text-blue-700',
                        item.status === 'REJECTED' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    {item.status === 'PENDING' ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(item)}
                          disabled={actionMutation.isPending}
                          title="Approve - Create new TMS record"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() =>
                            setLinkDialog({
                              open: true,
                              item,
                              recordId: '',
                              recordType: item.deviceType,
                            })
                          }
                          disabled={actionMutation.isPending}
                          title="Link - Connect to existing TMS record"
                        >
                          <Link className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(item)}
                          disabled={actionMutation.isPending}
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">
                        {item.reviewedAt ? formatDate(item.reviewedAt) : '—'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Link Dialog */}
      <Dialog open={linkDialog.open} onOpenChange={open => !open && setLinkDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Link to Existing Record</DialogTitle>
            <DialogDescription className="text-xs">
              Connect <strong>{linkDialog.item?.name}</strong> to an existing TMS {linkDialog.item?.deviceType?.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Record Type</Label>
              <Select
                value={linkDialog.recordType}
                onValueChange={v => setLinkDialog(prev => ({ ...prev, recordType: v as any }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRUCK">Truck</SelectItem>
                  <SelectItem value="TRAILER">Trailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Record ID</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Enter truck/trailer ID"
                value={linkDialog.recordId}
                onChange={e => setLinkDialog(prev => ({ ...prev, recordId: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground">
                You can find the ID in the truck/trailer details page URL
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLinkDialog(prev => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleLinkSubmit}
              disabled={!linkDialog.recordId || actionMutation.isPending}
            >
              <Link className="h-3 w-3 mr-1" />
              Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

