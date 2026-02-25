'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Archive } from 'lucide-react';

const ARCHIVABLE_STATUSES = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'REJECTED', label: 'Rejected' },
];

interface ArchivalConfig {
    enabled: boolean;
    archiveAfterDays: number;
    archiveStatuses: string[];
}

export default function LeadAgingSettings() {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState<ArchivalConfig>({
        enabled: false,
        archiveAfterDays: 90,
        archiveStatuses: ['REJECTED'],
    });

    const { data, isLoading } = useQuery({
        queryKey: ['crm-general-settings'],
        queryFn: async () => {
            const res = await fetch('/api/crm/settings/general');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    useEffect(() => {
        if (data?.crm?.autoArchival) {
            setConfig({
                enabled: data.crm.autoArchival.enabled ?? false,
                archiveAfterDays: data.crm.autoArchival.archiveAfterDays ?? 90,
                archiveStatuses: data.crm.autoArchival.archiveStatuses ?? ['REJECTED'],
            });
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/settings/general', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crm: { autoArchival: config } }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Lead aging settings saved');
            queryClient.invalidateQueries({ queryKey: ['crm-general-settings'] });
        },
        onError: () => toast.error('Failed to save settings'),
    });

    const toggleStatus = (status: string, checked: boolean) => {
        setConfig((c) => ({
            ...c,
            archiveStatuses: checked
                ? [...c.archiveStatuses, status]
                : c.archiveStatuses.filter((s) => s !== status),
        }));
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
                    <Archive className="h-5 w-5" />
                    Lead Aging & Auto-Archival
                </CardTitle>
                <CardDescription>
                    Automatically archive stale leads after a period of inactivity.
                    Archived leads can be restored by an admin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium">Auto-Archive Stale Leads</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Soft-delete leads that haven&apos;t been updated within the threshold.
                        </p>
                    </div>
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
                    />
                </div>

                {config.enabled && (
                    <>
                        <div className="flex items-center gap-3">
                            <Label className="text-sm whitespace-nowrap">Archive after</Label>
                            <Input
                                type="number"
                                min={7}
                                max={365}
                                value={config.archiveAfterDays}
                                onChange={(e) => setConfig((c) => ({
                                    ...c,
                                    archiveAfterDays: Math.max(7, parseInt(e.target.value) || 90),
                                }))}
                                className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days of inactivity</span>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Only archive leads in these statuses</Label>
                            {ARCHIVABLE_STATUSES.map((status) => (
                                <label key={status.value} className="flex items-center gap-3">
                                    <Checkbox
                                        checked={config.archiveStatuses.includes(status.value)}
                                        onCheckedChange={(checked) => toggleStatus(status.value, !!checked)}
                                    />
                                    <span className="text-sm">{status.label}</span>
                                </label>
                            ))}
                        </div>
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
                    Save Aging Settings
                </Button>
            </CardFooter>
        </Card>
    );
}
