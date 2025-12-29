'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    RefreshCw, MoreHorizontal, Edit, MapPin, Trash2,
    Truck, User, Phone, Clock, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { getPriorityBadge, getStatusBadge } from '@/components/ui/status-badge';
import InlineCaseEditor from '../InlineCaseEditor';
import FleetFilters, { FleetFilterState } from './FleetFilters';

interface Assignment {
    id: string;
    userId: string;
    role?: string;
    user: { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string };
}

interface Payment {
    id: string;
    paymentNumber: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
}

interface Breakdown {
    id: string;
    breakdownNumber: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: string;
    breakdownType: string;
    location: string;
    description: string;
    timeElapsed: string;
    serviceProvider?: string;
    serviceContact?: string;
    repairCost?: number;
    towingCost?: number;
    laborCost?: number;
    partsCost?: number;
    otherCosts?: number;
    totalCost: number;
    isDriverChargeable?: boolean;
    driverChargeNotes?: string;
    resolution?: string;
    repairNotes?: string;
    truck: { id: string; truckNumber: string; make?: string; model?: string };
    driver?: { id: string; driverNumber: string; user: { id: string; firstName: string; lastName: string; phone?: string; email?: string } } | null;
    assignments?: Assignment[];
    payments?: Payment[];
    totalPaid?: number;
}

interface ActiveBreakdownsData {
    breakdowns: Breakdown[];
    stats: { total: number };
}

interface BreakdownsDataTableProps {
    mode?: 'compact' | 'full';
    searchQuery?: string;
    showFilters?: boolean;
    maxRows?: number;
}

async function fetchActiveBreakdowns() {
    const response = await fetch(apiUrl('/api/fleet/breakdowns/active'));
    if (!response.ok) throw new Error('Failed to fetch active breakdowns');
    return response.json();
}

export default function BreakdownsDataTable({
    mode = 'full',
    searchQuery = '',
    showFilters = true,
    maxRows,
}: BreakdownsDataTableProps) {
    const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
    const [filters, setFilters] = useState<FleetFilterState>({
        status: 'ALL',
        priority: 'ALL',
        type: 'ALL',
    });

    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: ActiveBreakdownsData }>({
        queryKey: ['activeBreakdowns-table', mode],
        queryFn: fetchActiveBreakdowns,
        refetchInterval: 30000,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(apiUrl(`/api/fleet/breakdowns/${id}`), {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete breakdown');
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success('Breakdown case deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-table'] });
            queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] }); // Also invalidate the other query key just in case
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleDelete = (id: string, breakdownNumber: string) => {
        if (window.confirm(`Are you sure you want to delete breakdown case #${breakdownNumber}? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    const breakdowns = data?.data?.breakdowns || [];

    const filteredBreakdowns = breakdowns.filter((b) => {
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            return (
                b.breakdownNumber.toLowerCase().includes(searchLower) ||
                b.truck.truckNumber.toLowerCase().includes(searchLower) ||
                b.driver?.user.firstName.toLowerCase().includes(searchLower) ||
                b.driver?.user.lastName.toLowerCase().includes(searchLower) ||
                b.location.toLowerCase().includes(searchLower)
            );
        }
        if (filters.status !== 'ALL' && b.status !== filters.status) return false;
        if (filters.priority !== 'ALL' && b.priority !== filters.priority) return false;
        if (filters.type !== 'ALL' && b.breakdownType !== filters.type) return false;
        return true;
    });

    const displayedBreakdowns = maxRows
        ? filteredBreakdowns.slice(0, maxRows)
        : filteredBreakdowns;

    const openEditor = (breakdown: Breakdown) => {
        setSelectedBreakdown(breakdown);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load cases</p>
                    <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (breakdowns.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active cases</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    {showFilters && (
                        <div className="p-3 border-b">
                            <FleetFilters filters={filters} onFiltersChange={setFilters} />
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[32px]"></TableHead>
                                    <TableHead className="w-[70px]">Priority</TableHead>
                                    <TableHead>Case #</TableHead>
                                    <TableHead>Truck</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Elapsed</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedBreakdowns.map((breakdown) => (
                                    <TableRow
                                        key={breakdown.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => openEditor(breakdown)}
                                    >
                                        <TableCell className="py-2">
                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="py-2">{getPriorityBadge(breakdown.priority, 'xs')}</TableCell>
                                        <TableCell className="py-2">
                                            <span className="font-mono text-xs font-medium">{breakdown.breakdownNumber}</span>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center gap-1">
                                                <Truck className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs">#{breakdown.truck.truckNumber}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {breakdown.driver ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-1">
                                                                <User className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-xs">
                                                                    {breakdown.driver.user.firstName.charAt(0)}. {breakdown.driver.user.lastName}
                                                                </span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
                                                            </p>
                                                            {breakdown.driver.user.phone && <p className="text-xs">{breakdown.driver.user.phone}</p>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {breakdown.assignments && breakdown.assignments.length > 0 ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-1">
                                                                {breakdown.assignments.slice(0, 2).map((a) => (
                                                                    <div
                                                                        key={a.id}
                                                                        className="text-[10px] h-5 w-5 rounded-full bg-primary/10 border flex items-center justify-center font-semibold"
                                                                    >
                                                                        {a.user.firstName.charAt(0)}
                                                                        {a.user.lastName.charAt(0)}
                                                                    </div>
                                                                ))}
                                                                {breakdown.assignments.length > 2 && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        +{breakdown.assignments.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {breakdown.assignments.map((a) => (
                                                                <p key={a.id} className="text-xs">
                                                                    {a.user.firstName} {a.user.lastName} {a.role && `(${a.role})`}
                                                                </p>
                                                            ))}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center gap-1 max-w-[150px]">
                                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                <span className="text-xs truncate">{breakdown.location}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">{getStatusBadge(breakdown.status, 'xs')}</TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs">{breakdown.timeElapsed}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-right">
                                            {breakdown.totalCost > 0 || (breakdown.totalPaid && breakdown.totalPaid > 0) ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="text-xs">
                                                                <span className="font-medium">${breakdown.totalCost?.toFixed(0) || 0}</span>
                                                                {breakdown.totalPaid && breakdown.totalPaid > 0 && (
                                                                    <span className="text-green-600 ml-1">
                                                                        ({((breakdown.totalPaid / breakdown.totalCost) * 100).toFixed(0)}%)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs">Estimated: ${breakdown.totalCost?.toFixed(2)}</p>
                                                            <p className="text-xs text-green-600">Paid: ${breakdown.totalPaid?.toFixed(2) || 0}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditor(breakdown)}>
                                                        <Edit className="h-3.5 w-3.5 mr-2" />
                                                        Edit Case
                                                    </DropdownMenuItem>
                                                    {breakdown.driver?.user.phone && (
                                                        <DropdownMenuItem
                                                            onClick={() => (window.location.href = `tel:${breakdown.driver?.user.phone}`)}
                                                        >
                                                            <Phone className="h-3.5 w-3.5 mr-2" />
                                                            Call Driver
                                                        </DropdownMenuItem>
                                                    )}
                                                    {session?.user?.role === 'ADMIN' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(breakdown.id, breakdown.breakdownNumber)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                            Delete Case
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {mode === 'compact' && filteredBreakdowns.length > (maxRows || 20) && (
                        <div className="p-3 border-t text-center">
                            <Link href="/dashboard/fleet">
                                <Button variant="link" size="sm">
                                    View all {filteredBreakdowns.length} cases →
                                </Button>
                            </Link>
                        </div>
                    )}

                    {searchQuery && filteredBreakdowns.length === 0 && breakdowns.length > 0 && (
                        <div className="p-6 text-center">
                            <p className="text-muted-foreground text-sm">No cases match your search "{searchQuery}"</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Sheet open={!!selectedBreakdown} onOpenChange={(open) => !open && setSelectedBreakdown(null)}>
                <SheetContent className="sm:max-w-5xl overflow-y-auto">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit Case
                        </SheetTitle>
                    </SheetHeader>
                    {selectedBreakdown && (
                        <InlineCaseEditor
                            breakdown={selectedBreakdown}
                            onClose={() => setSelectedBreakdown(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
