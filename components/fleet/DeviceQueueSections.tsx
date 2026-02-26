'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Link2,
  RotateCcw,
  Search,
  Truck,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DeviceQueueItem {
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
  rejectionReason?: string;
  createdAt: string;
  reviewedBy?: { firstName: string; lastName: string };
}

export interface DeviceQueueTableProps {
  items: DeviceQueueItem[];
  loading: boolean;
  currentStatus: string;
  currentMcNumberId?: string | null;
  onActionComplete: () => void;
}

// ─── Confidence helpers ──────────────────────────────────────────────────────

type Confidence = 'high' | 'medium' | 'low' | 'gateway';

function getConfidence(d: DeviceQueueItem): Confidence {
  const n = d.name.toLowerCase();
  if (
    n.includes('gateway') ||
    n.includes('deactivated') ||
    n.includes('previously paired') ||
    n.includes('unpaired') ||
    /^[a-z0-9]{4}-[a-z0-9]{3}-[a-z0-9]{3}$/i.test(d.name)
  ) return 'gateway';
  if (d.vin && d.vin.length > 5) return 'high';
  if (d.licensePlate && d.make) return 'medium';
  if (d.make || d.model) return 'medium';
  return 'low';
}

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  gateway: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Review',
  gateway: 'Gateway',
};

// ─── Main table component ────────────────────────────────────────────────────

export function DeviceQueueTable({
  items,
  loading,
  currentStatus,
  currentMcNumberId,
  onActionComplete,
}: DeviceQueueTableProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActioning, setBulkActioning] = useState(false);
  const [search, setSearch] = useState('');
  const [linkTarget, setLinkTarget] = useState<DeviceQueueItem | null>(null);

  const isPending = currentStatus === 'PENDING';

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.vin?.toLowerCase().includes(q) ||
        d.licensePlate?.toLowerCase().includes(q) ||
        d.make?.toLowerCase().includes(q) ||
        d.model?.toLowerCase().includes(q)
    );
  }, [items, search]);

  // Reset selection when items list changes
  useEffect(() => { setSelectedIds(new Set()); }, [items]);

  const runAction = async (action: string, queueId: string, extra?: Record<string, unknown>) => {
    setActioningId(queueId);
    try {
      const res = await fetch('/api/fleet/device-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          queueId,
          additionalData: { mcNumberId: currentMcNumberId },
          ...extra,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onActionComplete();
      } else {
        toast.error(data.error?.message || `Failed to ${action} device`);
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const runBulk = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;
    setBulkActioning(true);
    let ok = 0;
    let fail = 0;
    for (const id of selectedIds) {
      const res = await fetch('/api/fleet/device-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          queueId: id,
          additionalData: { mcNumberId: currentMcNumberId },
        }),
      });
      if (res.ok) ok++; else fail++;
    }
    if (ok > 0) toast.success(`${ok} device(s) ${action === 'approve' ? 'approved' : 'rejected'}`);
    if (fail > 0) toast.error(`${fail} device(s) failed — check each one individually`);
    setSelectedIds(new Set());
    onActionComplete();
    setBulkActioning(false);
  };

  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  };

  // ── Empty / Loading states ─────────────────────────────────────────────────

  if (loading && items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">Loading devices...</div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Info className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No devices in {currentStatus.toLowerCase()} status</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, VIN, plate, make..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        {search && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {items.length}
          </span>
        )}
        {!isPending && currentStatus === 'REJECTED' && (
          <span className="text-xs text-muted-foreground ml-auto">
            Use Re-queue to move a device back to Pending
          </span>
        )}
      </div>

      {/* Bulk action bar — only for PENDING */}
      {isPending && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary/20 bg-primary/5">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              onClick={() => runBulk('approve')}
              disabled={bulkActioning}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Approve {selectedIds.size}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => runBulk('reject')}
              disabled={bulkActioning}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Reject {selectedIds.size}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkActioning}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {isPending && (
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                </th>
              )}
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide w-24">
                Type
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Name
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                VIN / Plate
              </th>
              <th className="hidden md:table-cell px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Make / Model
              </th>
              {isPending && (
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide w-20">
                  Match
                </th>
              )}
              {!isPending && (
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {currentStatus === 'REJECTED' ? 'Reason' : 'Status'}
                </th>
              )}
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((device) => {
              const confidence = getConfidence(device);
              const isActioning = actioningId === device.id;
              const isBusy = isActioning || bulkActioning;

              return (
                <tr
                  key={device.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    selectedIds.has(device.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  {isPending && (
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(device.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          e.target.checked ? next.add(device.id) : next.delete(device.id);
                          setSelectedIds(next);
                        }}
                        className="h-4 w-4 rounded cursor-pointer"
                      />
                    </td>
                  )}

                  {/* Type */}
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className="text-xs gap-1 font-normal">
                      {device.deviceType === 'TRUCK' ? (
                        <Truck className="h-3 w-3" />
                      ) : (
                        <span>🚚</span>
                      )}
                      {device.deviceType === 'TRUCK' ? 'Truck' : 'Trailer'}
                    </Badge>
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2.5 font-medium max-w-[200px]">
                    <span className="truncate block" title={device.name}>
                      {device.name}
                    </span>
                  </td>

                  {/* VIN / Plate */}
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {device.vin ? (
                      <span title={device.vin}>
                        {device.vin.length > 13 ? `${device.vin.slice(0, 13)}…` : device.vin}
                      </span>
                    ) : device.licensePlate ? (
                      device.licensePlate
                    ) : (
                      <span className="opacity-30">—</span>
                    )}
                  </td>

                  {/* Make / Model */}
                  <td className="hidden md:table-cell px-3 py-2.5 text-xs text-muted-foreground">
                    {device.make || device.model || device.year ? (
                      [device.make, device.model, device.year].filter(Boolean).join(' ')
                    ) : (
                      <span className="opacity-30">—</span>
                    )}
                  </td>

                  {/* Confidence (PENDING only) */}
                  {isPending && (
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[confidence]}`}
                      >
                        {CONFIDENCE_LABELS[confidence]}
                      </span>
                    </td>
                  )}

                  {/* Status detail (non-PENDING) */}
                  {!isPending && (
                    <td className="px-3 py-2.5 text-xs max-w-[180px]">
                      {currentStatus === 'REJECTED' && device.rejectionReason ? (
                        <span
                          className="text-red-600 dark:text-red-400 flex items-center gap-1 truncate"
                          title={device.rejectionReason}
                        >
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          {device.rejectionReason}
                        </span>
                      ) : currentStatus === 'LINKED' ? (
                        <span className="text-green-600 dark:text-green-400">Linked to record</span>
                      ) : currentStatus === 'APPROVED' ? (
                        <span className="text-blue-600 dark:text-blue-400">New record created</span>
                      ) : null}
                    </td>
                  )}

                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {isPending && confidence !== 'gateway' && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => runAction('approve', device.id)}
                            disabled={isBusy}
                            title="Create a new TMS record or auto-link if VIN matches"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setLinkTarget(device)}
                            disabled={isBusy}
                            title="Link to an existing truck/trailer record"
                          >
                            <Link2 className="h-3.5 w-3.5 mr-1" />
                            Link
                          </Button>
                        </>
                      )}
                      {isPending && (
                        <Button
                          size="sm"
                          variant={confidence === 'gateway' ? 'destructive' : 'ghost'}
                          className="h-7 text-xs px-2.5"
                          onClick={() => runAction('reject', device.id)}
                          disabled={isBusy}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      )}
                      {!isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => runAction('requeue', device.id)}
                          disabled={isActioning}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Re-queue
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Link dialog */}
      {linkTarget && (
        <LinkDialog
          device={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLinked={() => {
            setLinkTarget(null);
            onActionComplete();
          }}
        />
      )}
    </div>
  );
}

// ─── Link Dialog ─────────────────────────────────────────────────────────────

interface LinkDialogProps {
  device: DeviceQueueItem;
  onClose: () => void;
  onLinked: () => void;
}

function LinkDialog({ device, onClose, onLinked }: LinkDialogProps) {
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [linking, setLinking] = useState(false);

  const isTruck = device.deviceType === 'TRUCK';
  const endpoint = isTruck ? '/api/trucks' : '/api/trailers';
  const numberField = isTruck ? 'truckNumber' : 'trailerNumber';

  useEffect(() => {
    const fetchRecords = async () => {
      setFetchLoading(true);
      setSelected(null);
      try {
        const params = new URLSearchParams({ pageSize: '50' });
        if (search.trim()) params.set('search', search.trim());
        const res = await fetch(`${endpoint}?${params}`);
        const data = await res.json();
        const list = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.items)
          ? data.data.items
          : [];
        setRecords(list);
      } catch {
        setRecords([]);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchRecords();
  }, [search, endpoint]);

  const handleConfirm = async () => {
    if (!selected) return;
    setLinking(true);
    try {
      const res = await fetch('/api/fleet/device-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link',
          queueId: device.id,
          recordId: selected.id,
          recordType: device.deviceType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`"${device.name}" linked to ${isTruck ? 'truck' : 'trailer'} ${selected[numberField]}`);
        onLinked();
      } else {
        toast.error(data.error?.message || 'Failed to link device');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Link &ldquo;{device.name}&rdquo; to existing {isTruck ? 'truck' : 'trailer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${isTruck ? 'truck' : 'trailer'} number or VIN...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="border rounded-md max-h-56 overflow-y-auto divide-y">
            {fetchLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : records.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No {isTruck ? 'trucks' : 'trailers'} found
              </div>
            ) : (
              records.map((r) => (
                <button
                  key={r.id}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors text-sm ${
                    selected?.id === r.id ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => setSelected(r)}
                >
                  <div className="font-medium">{r[numberField]}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {[r.vin, r.make, r.model, r.year].filter(Boolean).join(' · ')}
                    {r.samsaraId && (
                      <span className="text-orange-500 ml-1">· already synced</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {selected && (
            <p className="text-sm text-muted-foreground">
              Will link <strong>{device.name}</strong> →{' '}
              <strong>{selected[numberField]}</strong>
              {selected.samsaraId && (
                <span className="text-orange-500 ml-1">
                  (this record already has a Samsara link — it will be overwritten)
                </span>
              )}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={linking}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || linking}>
            {linking ? 'Linking...' : 'Confirm Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
