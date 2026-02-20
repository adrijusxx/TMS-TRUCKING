'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, Users } from 'lucide-react';

type Strategy = 'ROUND_ROBIN' | 'WEIGHTED' | 'LEAST_LOADED';

interface RecruiterRow {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    weight: number;
    maxCapacity: number;
    isNew?: boolean;
}

interface Config {
    enabled: boolean;
    strategy: Strategy;
    assignOnSources: string[];
}

const STRATEGY_LABELS: Record<Strategy, string> = {
    ROUND_ROBIN: 'Round Robin',
    WEIGHTED: 'Weighted',
    LEAST_LOADED: 'Least Loaded',
};

const STRATEGY_DESCRIPTIONS: Record<Strategy, string> = {
    ROUND_ROBIN: 'Assigns leads in rotation — each recruiter gets equal turns regardless of weight.',
    WEIGHTED: 'Assigns proportionally by weight — higher weight = more leads received.',
    LEAST_LOADED: 'Assigns to the recruiter with the fewest active leads.',
};

export default function RecruiterAssignmentSettings() {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState<Config>({
        enabled: false,
        strategy: 'ROUND_ROBIN',
        assignOnSources: [],
    });
    const [recruiters, setRecruiters] = useState<RecruiterRow[]>([]);
    const [addUserId, setAddUserId] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['recruiter-assignment'],
        queryFn: async () => {
            const res = await fetch('/api/crm/recruiter-assignment');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    const { data: staffData } = useQuery({
        queryKey: ['staff-users'],
        queryFn: async () => {
            const res = await fetch('/api/users/staff');
            if (!res.ok) throw new Error('Failed to fetch staff');
            return res.json();
        },
        staleTime: 60_000,
    });

    const allStaff: { id: string; firstName: string; lastName: string; email: string }[] =
        staffData?.data ?? staffData?.users ?? [];

    // Recruiters not yet added
    const availableToAdd = allStaff.filter((u) => !recruiters.find((r) => r.userId === u.id));

    useEffect(() => {
        if (data?.config) {
            setConfig({
                enabled: data.config.enabled,
                strategy: data.config.strategy ?? 'ROUND_ROBIN',
                assignOnSources: data.config.assignOnSources ?? [],
            });
        }
        if (data?.recruiters) {
            setRecruiters(
                data.recruiters.map((r: any) => ({
                    userId: r.userId,
                    firstName: r.user.firstName,
                    lastName: r.user.lastName,
                    email: r.user.email,
                    isActive: r.isActive,
                    weight: r.weight,
                    maxCapacity: r.maxCapacity,
                }))
            );
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/recruiter-assignment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config,
                    recruiters: recruiters.map((r) => ({
                        userId: r.userId,
                        isActive: r.isActive,
                        weight: r.weight,
                        maxCapacity: r.maxCapacity,
                    })),
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Assignment settings saved');
            queryClient.invalidateQueries({ queryKey: ['recruiter-assignment'] });
        },
        onError: () => toast.error('Failed to save settings'),
    });

    const addRecruiter = () => {
        const staff = allStaff.find((u) => u.id === addUserId);
        if (!staff) return;
        setRecruiters((prev) => [
            ...prev,
            {
                userId: staff.id,
                firstName: staff.firstName,
                lastName: staff.lastName,
                email: staff.email,
                isActive: true,
                weight: 1,
                maxCapacity: 50,
                isNew: true,
            },
        ]);
        setAddUserId('');
    };

    const updateRecruiter = (userId: string, field: keyof RecruiterRow, value: unknown) => {
        setRecruiters((prev) =>
            prev.map((r) => (r.userId === userId ? { ...r, [field]: value } : r))
        );
    };

    const removeRecruiter = (userId: string) => {
        setRecruiters((prev) => prev.filter((r) => r.userId !== userId));
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lead Auto-Assignment
                </CardTitle>
                <CardDescription>
                    Automatically assign incoming leads to recruiters using round-robin, weighted, or
                    least-loaded strategies.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium">Auto-Assignment</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Automatically assign new leads to recruiters when created or imported.
                        </p>
                    </div>
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
                    />
                </div>

                {config.enabled && (
                    <>
                        {/* Strategy picker */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Assignment Strategy</Label>
                            <Select
                                value={config.strategy}
                                onValueChange={(v) => setConfig((c) => ({ ...c, strategy: v as Strategy }))}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(STRATEGY_LABELS) as Strategy[]).map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {STRATEGY_LABELS[s]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {STRATEGY_DESCRIPTIONS[config.strategy]}
                            </p>
                        </div>

                        {/* Recruiter table */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Active Recruiters</Label>

                            {recruiters.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                                    No recruiters configured. Add at least one below.
                                </p>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-medium">Recruiter</th>
                                                <th className="text-left px-3 py-2 font-medium w-16">Active</th>
                                                {config.strategy === 'WEIGHTED' && (
                                                    <th className="text-left px-3 py-2 font-medium w-24">
                                                        Weight
                                                        <span className="font-normal text-muted-foreground ml-1">(1–10)</span>
                                                    </th>
                                                )}
                                                <th className="text-left px-3 py-2 font-medium w-28">
                                                    Max Leads
                                                </th>
                                                <th className="w-10" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recruiters.map((r) => (
                                                <tr key={r.userId} className="border-t">
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium">
                                                            {r.firstName} {r.lastName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{r.email}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Switch
                                                            checked={r.isActive}
                                                            onCheckedChange={(v) =>
                                                                updateRecruiter(r.userId, 'isActive', v)
                                                            }
                                                        />
                                                    </td>
                                                    {config.strategy === 'WEIGHTED' && (
                                                        <td className="px-3 py-2">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={10}
                                                                value={r.weight}
                                                                onChange={(e) =>
                                                                    updateRecruiter(
                                                                        r.userId,
                                                                        'weight',
                                                                        Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                                                                    )
                                                                }
                                                                className="w-16"
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={500}
                                                            value={r.maxCapacity}
                                                            onChange={(e) =>
                                                                updateRecruiter(
                                                                    r.userId,
                                                                    'maxCapacity',
                                                                    Math.max(1, parseInt(e.target.value) || 1)
                                                                )
                                                            }
                                                            className="w-20"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            onClick={() => removeRecruiter(r.userId)}
                                                            className="text-muted-foreground hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Add recruiter row */}
                            {availableToAdd.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Select value={addUserId} onValueChange={setAddUserId}>
                                        <SelectTrigger className="flex-1 max-w-sm">
                                            <SelectValue placeholder="Add a recruiter…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableToAdd.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.firstName} {u.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addRecruiter}
                                        disabled={!addUserId}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Weight summary for WEIGHTED strategy */}
                        {config.strategy === 'WEIGHTED' && recruiters.filter((r) => r.isActive).length > 0 && (
                            <div className="rounded-md bg-muted/50 p-3 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Lead distribution preview</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const active = recruiters.filter((r) => r.isActive);
                                        const total = active.reduce((s, r) => s + r.weight, 0);
                                        return active.map((r) => (
                                            <Badge key={r.userId} variant="outline" className="text-xs">
                                                {r.firstName}: {Math.round((r.weight / total) * 100)}%
                                            </Badge>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <CardFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Assignment Settings
                </Button>
            </CardFooter>
        </Card>
    );
}
