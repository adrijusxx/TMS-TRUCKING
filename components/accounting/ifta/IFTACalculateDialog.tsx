'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

interface PreviewLoad {
  id: string;
  loadNumber: string;
  route: string;
  driver: string;
  truck: string;
  calculated: boolean;
  missingLocation: boolean;
}

interface PreviewData {
  totalLoads: number;
  alreadyCalculated: number;
  pendingCalculation: number;
  missingLocation: number;
  toProcess: number;
  loads: PreviewLoad[];
}

interface CalcResult {
  message: string;
  totalLoads?: number;
  calculated?: number;
  skipped?: number;
  errors?: number;
}

interface Driver { id: string; firstName: string; lastName: string }
interface Truck { id: string; truckNumber: string }

interface IFTACalculateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quarter: number;
  year: number;
  onComplete: () => void;
}

async function fetchPreview(quarter: number, year: number, driverId?: string, truckId?: string, force?: boolean) {
  const params = new URLSearchParams({ quarter: String(quarter), year: String(year) });
  if (driverId) params.set('driverId', driverId);
  if (truckId) params.set('truckId', truckId);
  if (force) params.set('forceRecalculate', 'true');
  const res = await fetch(apiUrl(`/api/ifta/preview?${params}`));
  if (!res.ok) throw new Error('Failed to fetch preview');
  return res.json();
}

async function fetchDrivers() {
  const res = await fetch(apiUrl('/api/drivers?limit=1000'));
  if (!res.ok) return { data: [] };
  return res.json();
}

async function fetchTrucks() {
  const res = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!res.ok) return { data: [] };
  return res.json();
}

async function runCalculation(opts: { quarter: number; year: number; driverId?: string; truckId?: string; forceRecalculate: boolean }) {
  const res = await fetch(apiUrl('/api/ifta/calculate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message || 'Calculation failed');
  }
  return res.json();
}

export function IFTACalculateDialog({ open, onOpenChange, quarter, year, onComplete }: IFTACalculateDialogProps) {
  const [driverId, setDriverId] = useState<string>('');
  const [truckId, setTruckId] = useState<string>('');
  const [forceRecalculate, setForceRecalculate] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<CalcResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) { setResult(null); setElapsed(0); stopTimer(); }
    return () => stopTimer();
  }, [open, stopTimer]);

  // Fetch preview
  const { data: previewRes, isLoading: previewLoading } = useQuery({
    queryKey: ['ifta-preview', quarter, year, driverId, truckId, forceRecalculate],
    queryFn: () => fetchPreview(quarter, year, driverId || undefined, truckId || undefined, forceRecalculate),
    enabled: open && !result,
  });

  // Fetch drivers & trucks for filters
  const { data: driversRes } = useQuery({ queryKey: ['drivers-list'], queryFn: fetchDrivers, enabled: open });
  const { data: trucksRes } = useQuery({ queryKey: ['trucks-list'], queryFn: fetchTrucks, enabled: open });

  const preview: PreviewData | null = previewRes?.data || null;
  const drivers: Driver[] = (driversRes?.data || []).map((d: any) => ({
    id: d.id, firstName: d.user?.firstName || d.firstName || '', lastName: d.user?.lastName || d.lastName || '',
  }));
  const trucks: Truck[] = (trucksRes?.data || []).map((t: any) => ({ id: t.id, truckNumber: t.truckNumber || '' }));

  const calcMutation = useMutation({
    mutationFn: () => runCalculation({ quarter, year, driverId: driverId || undefined, truckId: truckId || undefined, forceRecalculate }),
    onMutate: () => {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    },
    onSuccess: (res) => {
      stopTimer();
      setResult(res.data);
      toast.success(res.data.message);
      onComplete();
    },
    onError: (err: Error) => { stopTimer(); toast.error(err.message); },
  });

  const handleClose = () => {
    if (!calcMutation.isPending) {
      setDriverId(''); setTruckId(''); setForceRecalculate(false); setResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Calculate IFTA — Q{quarter} {year}</DialogTitle>
          <DialogDescription>
            Process delivered loads to calculate state-by-state mileage via Google Maps routing.
          </DialogDescription>
        </DialogHeader>

        {/* Result view */}
        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              {result.errors && result.errors > 0
                ? <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                : <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />}
              <div>
                <p className="font-medium">{result.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Completed in {elapsed}s. Click &quot;Run Report&quot; on the main page to see updated results.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : calcMutation.isPending ? (
          /* Running view */
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Processing {preview?.toProcess || 0} loads...
              </div>
              <span className="text-muted-foreground tabular-nums">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden relative">
              <div className="h-full w-1/3 bg-primary rounded-full absolute animate-bounce-x"
                style={{ animation: 'bounce-x 1.5s ease-in-out infinite alternate', left: 0 }} />
              <style>{`@keyframes bounce-x { 0% { transform: translateX(0); } 100% { transform: translateX(200%); }}`}</style>
            </div>
            <p className="text-xs text-muted-foreground">
              Each load is routed via Google Maps to calculate state mileage. This may take several minutes for large quarters.
            </p>
          </div>
        ) : (
          /* Preview + options view */
          <div className="space-y-4 py-2">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Filter by Driver</Label>
                <Select value={driverId || 'all'} onValueChange={(v) => setDriverId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All drivers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All drivers</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Filter by Truck</Label>
                <Select value={truckId || 'all'} onValueChange={(v) => setTruckId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All trucks" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All trucks</SelectItem>
                    {trucks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.truckNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Force recalculate toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Force recalculate</Label>
                <p className="text-xs text-muted-foreground">Re-process loads that were already calculated</p>
              </div>
              <Switch checked={forceRecalculate} onCheckedChange={setForceRecalculate} />
            </div>

            {/* Preview stats */}
            {previewLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading preview...
              </div>
            ) : preview ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border p-2">
                    <p className="text-2xl font-bold">{preview.totalLoads}</p>
                    <p className="text-xs text-muted-foreground">Total loads</p>
                  </div>
                  <div className="rounded-lg border p-2">
                    <p className="text-2xl font-bold text-primary">{preview.toProcess}</p>
                    <p className="text-xs text-muted-foreground">To process</p>
                  </div>
                  <div className="rounded-lg border p-2">
                    <p className="text-2xl font-bold text-green-600">{preview.alreadyCalculated}</p>
                    <p className="text-xs text-muted-foreground">Already done</p>
                  </div>
                </div>

                {preview.missingLocation > 0 && (
                  <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 rounded p-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {preview.missingLocation} load(s) missing pickup/delivery location — these may produce inaccurate results.
                  </div>
                )}

                {preview.toProcess === 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {preview.totalLoads === 0
                      ? 'No delivered loads with a driver assigned found in this quarter.'
                      : 'All loads are already calculated. Enable "Force recalculate" to re-process them.'}
                  </div>
                )}

                {/* Load list preview */}
                {preview.loads.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1.5 font-medium">Load</th>
                          <th className="text-left px-2 py-1.5 font-medium">Route</th>
                          <th className="text-left px-2 py-1.5 font-medium">Driver</th>
                          <th className="text-center px-2 py-1.5 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.loads.map((l) => (
                          <tr key={l.id} className="border-t">
                            <td className="px-2 py-1 font-mono">{l.loadNumber}</td>
                            <td className="px-2 py-1 truncate max-w-[150px]">{l.route}</td>
                            <td className="px-2 py-1">{l.driver}</td>
                            <td className="px-2 py-1 text-center">
                              {l.missingLocation ? (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-[10px]">No location</Badge>
                              ) : l.calculated ? (
                                <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">Done</Badge>
                              ) : (
                                <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">Pending</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.totalLoads > 50 && (
                      <p className="text-[10px] text-muted-foreground text-center py-1">
                        Showing first 50 of {preview.totalLoads} loads
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => calcMutation.mutate()}
                disabled={!preview || preview.toProcess === 0}
              >
                Calculate {preview ? `(${preview.toProcess} loads)` : ''}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
