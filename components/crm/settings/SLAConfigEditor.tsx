'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Timer } from 'lucide-react';

interface SLAEntry {
    id: string | null;
    status: string;
    maxDays: number;
    enabled: boolean;
}

const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    DOCUMENTS_PENDING: 'Documents Pending',
    DOCUMENTS_COLLECTED: 'Documents Collected',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
};

export default function SLAConfigEditor() {
    const queryClient = useQueryClient();
    const [configs, setConfigs] = useState<SLAEntry[]>([]);

    const { data, isLoading } = useQuery({
        queryKey: ['sla-config'],
        queryFn: async () => {
            const res = await fetch('/api/crm/sla-config');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    useEffect(() => {
        if (data?.configs) {
            setConfigs(data.configs);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async (entries: SLAEntry[]) => {
            const res = await fetch('/api/crm/sla-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    configs: entries.map((e) => ({
                        status: e.status,
                        maxDays: e.maxDays,
                        enabled: e.enabled,
                    })),
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('SLA thresholds saved');
            queryClient.invalidateQueries({ queryKey: ['sla-config'] });
        },
        onError: () => toast.error('Failed to save SLA thresholds'),
    });

    const updateEntry = (status: string, field: 'maxDays' | 'enabled', value: number | boolean) => {
        setConfigs((prev) =>
            prev.map((c) => (c.status === status ? { ...c, [field]: value } : c))
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Pipeline SLA Thresholds
                </CardTitle>
                <CardDescription>
                    Get alerted when leads stay too long in a pipeline stage.
                    Checked daily at 6 AM.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {configs
                        .filter((c) => STATUS_LABELS[c.status])
                        .map((config) => (
                            <div key={config.status} className="flex items-center gap-4 py-2 border-b last:border-0">
                                <Switch
                                    checked={config.enabled}
                                    onCheckedChange={(v) => updateEntry(config.status, 'enabled', v)}
                                />
                                <Label className="w-40 text-sm">{STATUS_LABELS[config.status]}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={90}
                                        className="w-20"
                                        value={config.maxDays}
                                        onChange={(e) => updateEntry(config.status, 'maxDays', parseInt(e.target.value) || 1)}
                                        disabled={!config.enabled}
                                    />
                                    <span className="text-sm text-muted-foreground">days max</span>
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={() => saveMutation.mutate(configs)}
                    disabled={saveMutation.isPending}
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Thresholds
                </Button>
            </CardFooter>
        </Card>
    );
}
