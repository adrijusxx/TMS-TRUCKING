
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UnlinkedDriver {
    id: string;
    driverNumber: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    suggestedMatches: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        confidence: 'high' | 'medium' | 'low';
    }>;
}

interface ReconciliationResponse {
    count: number;
    items: Array<{
        driver: UnlinkedDriver;
        suggestedMatches: any[];
    }>;
    availableUsers: Array<{ id: string; firstName: string; lastName: string; email: string }>;
}

export default function ReconciliationPage() {
    const queryClient = useQueryClient();
    const [actionMap, setActionMap] = useState<Record<string, { type: 'LINK' | 'CREATE' | 'IGNORE', targetUserId?: string }>>({});

    const { data, isLoading } = useQuery<ReconciliationResponse>({
        queryKey: ['unlinked-drivers'],
        queryFn: async () => {
            const res = await fetch('/api/import/reconcile/drivers');
            if (!res.ok) throw new Error('Failed to fetch unlinked drivers');
            return res.json();
        }
    });

    const reconcileMutation = useMutation({
        mutationFn: async (payload: { driverId: string; action: 'LINK' | 'CREATE_NEW' | 'IGNORE'; targetUserId?: string }) => {
            const res = await fetch('/api/import/reconcile/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            toast.success('Driver reconciled successfully');
            queryClient.invalidateQueries({ queryKey: ['unlinked-drivers'] });
        },
        onError: (err) => {
            toast.error(`Error: ${err.message}`);
        }
    });

    const handleActionChange = (driverId: string, type: 'LINK' | 'CREATE' | 'IGNORE') => {
        setActionMap(prev => ({
            ...prev,
            [driverId]: { ...prev[driverId], type }
        }));

        if (type === 'CREATE') {
            reconcileMutation.mutate({ driverId, action: 'CREATE_NEW' });
        }
    };

    const handleLinkUser = (driverId: string, userId: string) => {
        setActionMap(prev => ({
            ...prev,
            [driverId]: { type: 'LINK', targetUserId: userId }
        }));
        reconcileMutation.mutate({ driverId, action: 'LINK', targetUserId: userId });
    };

    if (isLoading) return <div className="p-8">Loading reconciliation data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Reconciliation</h1>
                    <p className="text-muted-foreground">Match imported drivers to system users.</p>
                </div>
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['unlinked-drivers'] })}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Unlinked Drivers ({data?.count || 0})</CardTitle>
                    <CardDescription>These drivers were imported but are not linked to a User account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Driver Info</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Suggested Match</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.items.map((item) => {
                                const driver = item.driver;
                                const match = item.suggestedMatches?.[0]; // Best match

                                return (
                                    <TableRow key={driver.id}>
                                        <TableCell>
                                            <div className="font-medium">{driver.firstName || 'Unknown'} {driver.lastName || ''}</div>
                                            <div className="text-xs text-muted-foreground">{driver.email || 'No Email'} • {driver.driverNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                                Unlinked
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {match ? (
                                                <div className="flex items-center space-x-2 text-sm text-green-700">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>{match.firstName} {match.lastName} ({match.email})</span>
                                                    <Badge variant="secondary" className="text-xs">High Confidence</Badge>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">No obvious match</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {match ? (
                                                    <Button size="sm" onClick={() => handleLinkUser(driver.id, match.id)}>
                                                        Link to {match.firstName}
                                                    </Button>
                                                ) : (
                                                    <div className="flex space-x-2">
                                                        <Select onValueChange={(val) => {
                                                            if (val === 'create') handleActionChange(driver.id, 'CREATE');
                                                            else handleLinkUser(driver.id, val);
                                                        }}>
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Select Action" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="create"><span className="flex items-center"><UserPlus className="mr-2 h-4 w-4" /> Create New User</span></SelectItem>
                                                                {data?.availableUsers.map(u => (
                                                                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
