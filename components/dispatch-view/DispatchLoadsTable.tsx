'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { apiUrl, cn, formatCurrency } from '@/lib/utils';
import {
    Package,
    ArrowRight,
    X,
    ExternalLink,
    Truck,
    MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface DispatchLoadsTableProps {
    dispatcherId: string;
    selectedDriverId: string | null;
    onClearFilter: () => void;
}

interface Load {
    id: string;
    loadNumber: string;
    status: string;
    dispatchStatus: string | null;
    driver: { id: string; name: string } | null;
    truck: { id: string; unitNumber: string } | null;
    trailer: { id: string; unitNumber: string } | null;
    customer: { id: string; name: string } | null;
    pickup: {
        city: string | null;
        state: string | null;
        date: string | null;
        company: string | null;
    };
    delivery: {
        city: string | null;
        state: string | null;
        date: string | null;
        company: string | null;
    };
    revenue: number;
    totalMiles: number | null;
}

async function fetchDispatchLoads(dispatcherId: string, driverId?: string) {
    const params = new URLSearchParams();
    params.set('dispatcherId', dispatcherId);
    params.set('status', 'active');
    if (driverId) params.set('driverId', driverId);

    const res = await fetch(apiUrl(`/api/dispatch-view/loads?${params.toString()}`));
    if (!res.ok) throw new Error('Failed to fetch loads');
    const json = await res.json();
    return json.data as { loads: Load[]; total: number };
}

export default function DispatchLoadsTable({
    dispatcherId,
    selectedDriverId,
    onClearFilter
}: DispatchLoadsTableProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['dispatch-loads', dispatcherId, selectedDriverId],
        queryFn: () => fetchDispatchLoads(dispatcherId, selectedDriverId || undefined),
    });

    const statusConfig: Record<string, { label: string; color: string }> = {
        PENDING: { label: 'Pending', color: 'bg-gray-500/10 text-gray-500' },
        ASSIGNED: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-500' },
        EN_ROUTE_PICKUP: { label: 'En Route PU', color: 'bg-orange-500/10 text-orange-500' },
        AT_PICKUP: { label: 'At Pickup', color: 'bg-yellow-500/10 text-yellow-600' },
        LOADED: { label: 'Loaded', color: 'bg-purple-500/10 text-purple-500' },
        EN_ROUTE_DELIVERY: { label: 'En Route DEL', color: 'bg-indigo-500/10 text-indigo-500' },
        AT_DELIVERY: { label: 'At Delivery', color: 'bg-cyan-500/10 text-cyan-600' },
        DELIVERED: { label: 'Delivered', color: 'bg-green-500/10 text-green-500' },
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Active Loads</CardTitle>
                        {selectedDriverId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-xs gap-1 text-muted-foreground"
                                onClick={onClearFilter}
                            >
                                <X className="h-3 w-3" />
                                Clear filter
                            </Button>
                        )}
                    </div>
                    {data && (
                        <span className="text-xs text-muted-foreground">
                            {data.total} load{data.total !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-10" />
                        ))}
                    </div>
                ) : !data?.loads?.length ? (
                    <div className="py-8 text-center">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {selectedDriverId
                                ? 'No active loads for this driver'
                                : 'No active loads found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="text-xs">
                                    <TableHead className="w-24">Load #</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead className="w-24">Status</TableHead>
                                    <TableHead className="w-20 text-right">Revenue</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.loads.map((load) => {
                                    const status = statusConfig[load.status] || statusConfig.PENDING;

                                    return (
                                        <TableRow key={load.id} className="text-xs">
                                            <TableCell className="font-medium">
                                                {load.loadNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{load.driver?.name || '-'}</span>
                                                    {load.truck && (
                                                        <span className="text-muted-foreground flex items-center gap-0.5">
                                                            <Truck className="h-3 w-3" />
                                                            {load.truck.unitNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <MapPin className="h-3 w-3 text-green-500" />
                                                    <span>
                                                        {load.pickup.city}, {load.pickup.state}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3" />
                                                    <MapPin className="h-3 w-3 text-red-500" />
                                                    <span>
                                                        {load.delivery.city}, {load.delivery.state}
                                                    </span>
                                                </div>
                                                {load.pickup.date && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        PU: {format(new Date(load.pickup.date), 'MMM d')}
                                                        {load.delivery.date && (
                                                            <> → DEL: {format(new Date(load.delivery.date), 'MMM d')}</>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn('text-[10px]', status.color)}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(load.revenue)}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/loads/${load.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
