'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Target } from 'lucide-react';

interface RecruiterGoal {
    userId: string;
    firstName: string;
    lastName: string;
    monthlyLeadGoal: number | null;
    monthlyHireGoal: number | null;
    targetConversionRate: number | null;
}

export default function RecruiterGoalsSettings() {
    const queryClient = useQueryClient();
    const [goals, setGoals] = useState<RecruiterGoal[]>([]);

    const { data, isLoading } = useQuery({
        queryKey: ['recruiter-assignment'],
        queryFn: async () => {
            const res = await fetch('/api/crm/recruiter-assignment');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    useEffect(() => {
        if (data?.recruiters) {
            setGoals(
                data.recruiters.map((r: any) => ({
                    userId: r.userId,
                    firstName: r.user.firstName,
                    lastName: r.user.lastName,
                    monthlyLeadGoal: r.monthlyLeadGoal ?? null,
                    monthlyHireGoal: r.monthlyHireGoal ?? null,
                    targetConversionRate: r.targetConversionRate ?? null,
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
                    config: data?.config || { enabled: false, strategy: 'ROUND_ROBIN', assignOnSources: [] },
                    recruiters: data?.recruiters?.map((r: any) => {
                        const goal = goals.find((g) => g.userId === r.userId);
                        return {
                            userId: r.userId,
                            isActive: r.isActive,
                            weight: r.weight,
                            maxCapacity: r.maxCapacity,
                            monthlyLeadGoal: goal?.monthlyLeadGoal || null,
                            monthlyHireGoal: goal?.monthlyHireGoal || null,
                            targetConversionRate: goal?.targetConversionRate || null,
                        };
                    }) || [],
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Recruiter goals saved');
            queryClient.invalidateQueries({ queryKey: ['recruiter-assignment'] });
        },
        onError: () => toast.error('Failed to save goals'),
    });

    const updateGoal = (userId: string, field: keyof RecruiterGoal, value: number | null) => {
        setGoals((prev) =>
            prev.map((g) => (g.userId === userId ? { ...g, [field]: value } : g))
        );
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

    if (goals.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Recruiter Performance Goals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No recruiters configured. Add recruiters in the Assignment settings first.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recruiter Performance Goals
                </CardTitle>
                <CardDescription>
                    Set monthly targets for each recruiter. These are tracked on the CRM dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-3 py-2 font-medium">Recruiter</th>
                                <th className="text-left px-3 py-2 font-medium w-28">
                                    <Label className="text-xs">Leads/mo</Label>
                                </th>
                                <th className="text-left px-3 py-2 font-medium w-28">
                                    <Label className="text-xs">Hires/mo</Label>
                                </th>
                                <th className="text-left px-3 py-2 font-medium w-28">
                                    <Label className="text-xs">Conv. Rate %</Label>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {goals.map((g) => (
                                <tr key={g.userId} className="border-t">
                                    <td className="px-3 py-2 font-medium">
                                        {g.firstName} {g.lastName}
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="--"
                                            value={g.monthlyLeadGoal ?? ''}
                                            onChange={(e) =>
                                                updateGoal(g.userId, 'monthlyLeadGoal',
                                                    e.target.value ? parseInt(e.target.value) : null)
                                            }
                                            className="w-20"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="--"
                                            value={g.monthlyHireGoal ?? ''}
                                            onChange={(e) =>
                                                updateGoal(g.userId, 'monthlyHireGoal',
                                                    e.target.value ? parseInt(e.target.value) : null)
                                            }
                                            className="w-20"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={5}
                                            placeholder="--"
                                            value={g.targetConversionRate != null ? Math.round(g.targetConversionRate * 100) : ''}
                                            onChange={(e) =>
                                                updateGoal(g.userId, 'targetConversionRate',
                                                    e.target.value ? parseFloat(e.target.value) / 100 : null)
                                            }
                                            className="w-20"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Goals
                </Button>
            </CardFooter>
        </Card>
    );
}
