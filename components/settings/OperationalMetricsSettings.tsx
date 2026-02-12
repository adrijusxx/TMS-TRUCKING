'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fuel, TrendingUp, Wrench, CalendarDays, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

// --- Schema ---
const operationalMetricsSchema = z.object({
    averageFuelPrice: z.number().min(0, 'Fuel price cannot be negative'),
    averageMpg: z.number().min(0, 'MPG cannot be negative'),
    maintenanceCpm: z.number().min(0, 'Maintenance cost cannot be negative'),
    fixedCostPerDay: z.number().min(0, 'Fixed cost cannot be negative'),
});

type OperationalMetrics = z.infer<typeof operationalMetricsSchema>;

// --- Industry defaults (class 8 diesel trucks) ---
const INDUSTRY_DEFAULTS = {
    averageFuelPrice: 3.65,  // National avg ~$3.65/gal
    averageMpg: 6.5,         // Class 8 trucks avg 5.5-7.5 MPG
    maintenanceCpm: 0.18,    // ~$0.15-0.20/mile
    fixedCostPerDay: 85,     // Insurance + ELD + misc overhead
};

// --- API Helpers ---
async function fetchSystemConfig() {
    const res = await fetch(apiUrl('/api/system-config'));
    if (!res.ok) throw new Error('Failed to fetch');
    return (await res.json()).data;
}

async function updateSystemConfig(data: OperationalMetrics) {
    const res = await fetch(apiUrl('/api/system-config'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error?.message || 'Update failed');
    return res.json();
}

async function syncMetric(action: string) {
    const res = await fetch(apiUrl('/api/operational-metrics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error((await res.json()).error?.message || 'Sync failed');
    return (await res.json()).data;
}

// --- Component ---
export default function OperationalMetricsSettings() {
    const queryClient = useQueryClient();
    const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({
        fuel: 'idle',
        mpg: 'idle',
    });

    const { data: config, isLoading } = useQuery({
        queryKey: ['system-config'],
        queryFn: fetchSystemConfig,
    });

    const hasAnyValue = config?.averageFuelPrice || config?.averageMpg || config?.maintenanceCpm || config?.fixedCostPerDay;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
    } = useForm<OperationalMetrics>({
        resolver: zodResolver(operationalMetricsSchema) as any,
        values: {
            averageFuelPrice: config?.averageFuelPrice || (hasAnyValue ? 0 : INDUSTRY_DEFAULTS.averageFuelPrice),
            averageMpg: config?.averageMpg || (hasAnyValue ? 0 : INDUSTRY_DEFAULTS.averageMpg),
            maintenanceCpm: config?.maintenanceCpm || (hasAnyValue ? 0 : INDUSTRY_DEFAULTS.maintenanceCpm),
            fixedCostPerDay: config?.fixedCostPerDay || (hasAnyValue ? 0 : INDUSTRY_DEFAULTS.fixedCostPerDay),
        },
    });

    const saveMutation = useMutation({
        mutationFn: updateSystemConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-config'] });
            toast.success('Operational metrics saved');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Sync diesel price from EIA
    const handleSyncFuelPrice = async () => {
        setSyncStatus((s) => ({ ...s, fuel: 'loading' }));
        try {
            const result = await syncMetric('sync_fuel_price');
            if (result?.fuelPrice?.price) {
                setValue('averageFuelPrice', result.fuelPrice.price, { shouldDirty: true });
                toast.success(`Diesel price synced: $${result.fuelPrice.price}/gal (${result.fuelPrice.date || 'latest'})`);
                setSyncStatus((s) => ({ ...s, fuel: 'success' }));
            } else {
                toast.error(result?.fuelPrice?.error || 'Could not fetch diesel price');
                setSyncStatus((s) => ({ ...s, fuel: 'error' }));
            }
        } catch {
            toast.error('Sync failed');
            setSyncStatus((s) => ({ ...s, fuel: 'error' }));
        }
        setTimeout(() => setSyncStatus((s) => ({ ...s, fuel: 'idle' })), 4000);
    };

    // Sync MPG from Samsara
    const handleSyncMpg = async () => {
        setSyncStatus((s) => ({ ...s, mpg: 'loading' }));
        try {
            const result = await syncMetric('sync_mpg');
            if (result?.mpg?.averageMpg) {
                setValue('averageMpg', result.mpg.averageMpg, { shouldDirty: true });
                toast.success(`Fleet avg MPG synced: ${result.mpg.averageMpg} MPG (${result.mpg.vehicleCount} vehicles)`);
                setSyncStatus((s) => ({ ...s, mpg: 'success' }));
            } else {
                toast.error(result?.mpg?.error || 'No MPG data from Samsara');
                setSyncStatus((s) => ({ ...s, mpg: 'error' }));
            }
        } catch {
            toast.error('Samsara sync failed');
            setSyncStatus((s) => ({ ...s, mpg: 'error' }));
        }
        setTimeout(() => setSyncStatus((s) => ({ ...s, mpg: 'idle' })), 4000);
    };

    const onSubmit = (data: OperationalMetrics) => saveMutation.mutate(data);

    if (isLoading) return <div className="p-6">Loading...</div>;

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Operational Metrics & Projections</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        Fleet averages for projected profit. Pre-filled with industry defaults for Class 8 trucks — adjust to your fleet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        {/* Fuel Section */}
                        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <Fuel className="h-4 w-4" />
                                    Fuel Parameters
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="averageFuelPrice" className="text-xs">Avg Diesel Price ($/gal)</Label>
                                    <SyncButton
                                        status={syncStatus.fuel}
                                        onClick={handleSyncFuelPrice}
                                        tooltip="Pull from EIA"
                                    />
                                </div>
                                <Input
                                    id="averageFuelPrice"
                                    type="number"
                                    step="0.001"
                                    className="h-8 text-sm"
                                    {...register('averageFuelPrice', { valueAsNumber: true })}
                                />
                                {errors.averageFuelPrice && (
                                    <p className="text-[10px] text-destructive">{errors.averageFuelPrice.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="averageMpg" className="text-xs">Fleet Avg MPG</Label>
                                    <SyncButton
                                        status={syncStatus.mpg}
                                        onClick={handleSyncMpg}
                                        tooltip="Pull from Samsara"
                                    />
                                </div>
                                <Input
                                    id="averageMpg"
                                    type="number"
                                    step="0.1"
                                    className="h-8 text-sm"
                                    {...register('averageMpg', { valueAsNumber: true })}
                                />
                                {errors.averageMpg && (
                                    <p className="text-[10px] text-destructive">{errors.averageMpg.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Maintenance & Fixed Section */}
                        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 font-medium text-sm">
                                <Wrench className="h-4 w-4" />
                                Maintenance & Overhead
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="maintenanceCpm" className="text-xs">Maintenance Cost Per Mile ($)</Label>
                                <Input
                                    id="maintenanceCpm"
                                    type="number"
                                    step="0.01"
                                    className="h-8 text-sm"
                                    {...register('maintenanceCpm', { valueAsNumber: true })}
                                />
                                {errors.maintenanceCpm && (
                                    <p className="text-[10px] text-destructive">{errors.maintenanceCpm.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="fixedCostPerDay" className="text-xs">Fixed Costs Per Day ($)</Label>
                                <Input
                                    id="fixedCostPerDay"
                                    type="number"
                                    step="1"
                                    placeholder="Insurance, ELD, etc."
                                    className="h-8 text-sm"
                                    {...register('fixedCostPerDay', { valueAsNumber: true })}
                                />
                                {errors.fixedCostPerDay && (
                                    <p className="text-[10px] text-destructive">{errors.fixedCostPerDay.message}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground">Insurance + Registration + ELD + Overhead per truck.</p>
                            </div>
                        </div>
                    </div>

                    {/* Formula Reference */}
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Projection Formula
                        </h4>
                        <div className="text-[10px] space-y-0.5 text-muted-foreground font-mono">
                            <p>Fuel = (Miles / MPG) × Price &nbsp;|&nbsp; Maint = Miles × CPM</p>
                            <p>Total Cost = Fuel + Maint + Fixed + Driver Pay</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={!isDirty || saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save Metrics'}
                </Button>
            </div>
        </form>
    );
}

// --- Sync Button Sub-Component ---
function SyncButton({
    status,
    onClick,
    tooltip,
}: {
    status: 'idle' | 'loading' | 'success' | 'error';
    onClick: () => void;
    tooltip: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={status === 'loading'}
            title={tooltip}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
            {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-3 w-3 text-destructive" />}
            {status === 'idle' && <RefreshCw className="h-3 w-3" />}
            <span>{status === 'loading' ? 'Syncing...' : tooltip}</span>
        </button>
    );
}
