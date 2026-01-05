'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiUrl } from '@/lib/utils';
import DispatcherSelector from './DispatcherSelector';
import DispatchSummaryStats from './DispatchSummaryStats';
import DriverCardsGrid from './DriverCardsGrid';
import DispatchLoadsTable from './DispatchLoadsTable';
import { Users, Loader2 } from 'lucide-react';

interface Dispatcher {
    id: string;
    name: string;
    email: string;
    role: string;
    driverCount: number;
}

interface DriverStats {
    activeLoads: number;
    loadsLast30Days: number;
    revenueLast30Days: number;
    milesLast30Days: number;
    onTimePercentage: number;
}

interface Driver {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    dispatchStatus: string | null;
    mcNumber: string | null;
    currentTruck: {
        id: string;
        unitNumber: string;
        make: string;
        model: string;
        samsaraVehicleId: string | null;
    } | null;
    currentTrailer: {
        id: string;
        unitNumber: string;
        type: string;
    } | null;
    stats: DriverStats;
}

interface Summary {
    totalDrivers: number;
    driversAvailable: number;
    driversOnRoute: number;
    totalActiveLoads: number;
    totalRevenue30Days: number;
}

interface DispatcherSelectResponse {
    mode: 'dispatcher-select';
    dispatchers: Dispatcher[];
}

interface DashboardResponse {
    mode: 'dashboard';
    dispatcher: {
        id: string;
        name: string;
        email: string;
    };
    drivers: Driver[];
    summary: Summary;
    isAdmin: boolean;
}

type DispatchViewResponse = DispatcherSelectResponse | DashboardResponse;

async function fetchDispatchView(dispatcherId?: string) {
    const url = dispatcherId
        ? apiUrl(`/api/dispatch-view?dispatcherId=${dispatcherId}`)
        : apiUrl('/api/dispatch-view');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dispatch view');
    const json = await res.json();
    return json.data as DispatchViewResponse;
}

export default function DispatchViewClient() {
    const [selectedDispatcherId, setSelectedDispatcherId] = useState<string | null>(null);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['dispatch-view', selectedDispatcherId],
        queryFn: () => fetchDispatchView(selectedDispatcherId || undefined),
    });

    if (isLoading) {
        return <DispatchViewSkeleton />;
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Failed to load dispatch view. Please try again.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    // Dispatcher selection mode for admins
    if (data.mode === 'dispatcher-select') {
        return (
            <DispatcherSelector
                dispatchers={data.dispatchers}
                onSelect={setSelectedDispatcherId}
            />
        );
    }

    // Dashboard mode
    const { dispatcher, drivers, summary, isAdmin } = data;

    return (
        <div className="space-y-4">
            {/* Admin dispatcher selector */}
            {isAdmin && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Viewing:</span>
                    <button
                        onClick={() => setSelectedDispatcherId(null)}
                        className="text-primary hover:underline font-medium"
                    >
                        {dispatcher.name}
                    </button>
                    <span className="text-muted-foreground">(click to change)</span>
                </div>
            )}

            {/* Summary Stats */}
            <DispatchSummaryStats summary={summary} />

            {/* Driver Cards */}
            {drivers.length > 0 ? (
                <DriverCardsGrid
                    drivers={drivers}
                    selectedDriverId={selectedDriverId}
                    onSelectDriver={setSelectedDriverId}
                />
            ) : (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No drivers assigned to this dispatcher yet.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Loads Table */}
            {drivers.length > 0 && (
                <DispatchLoadsTable
                    dispatcherId={dispatcher.id}
                    selectedDriverId={selectedDriverId}
                    onClearFilter={() => setSelectedDriverId(null)}
                />
            )}
        </div>
    );
}

function DispatchViewSkeleton() {
    return (
        <div className="space-y-4">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                ))}
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            {/* Table skeleton */}
            <Skeleton className="h-64" />
        </div>
    );
}
