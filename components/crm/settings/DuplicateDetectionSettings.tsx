'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Copy } from 'lucide-react';

const MATCH_FIELDS = [
    { value: 'phone', label: 'Phone Number', description: 'Normalized last 10 digits' },
    { value: 'email', label: 'Email Address', description: 'Case-insensitive match' },
    { value: 'cdlNumber', label: 'CDL Number', description: 'Exact match' },
    { value: 'name', label: 'First + Last Name', description: 'Case-insensitive match' },
];

interface DuplicateConfig {
    enabled: boolean;
    matchFields: string[];
}

export default function DuplicateDetectionSettings() {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState<DuplicateConfig>({
        enabled: true,
        matchFields: ['phone', 'email'],
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
        if (data?.crm?.duplicateDetection) {
            setConfig({
                enabled: data.crm.duplicateDetection.enabled ?? true,
                matchFields: data.crm.duplicateDetection.matchFields ?? ['phone', 'email'],
            });
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/settings/general', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crm: { duplicateDetection: config } }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Duplicate detection settings saved');
            queryClient.invalidateQueries({ queryKey: ['crm-general-settings'] });
        },
        onError: () => toast.error('Failed to save settings'),
    });

    const toggleField = (field: string, checked: boolean) => {
        setConfig((c) => ({
            ...c,
            matchFields: checked
                ? [...c.matchFields, field]
                : c.matchFields.filter((f) => f !== field),
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
                    <Copy className="h-5 w-5" />
                    Duplicate Detection
                </CardTitle>
                <CardDescription>
                    Warn when creating or importing leads that may already exist.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium">Enable Duplicate Detection</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Show a warning when a new lead matches an existing lead.
                        </p>
                    </div>
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
                    />
                </div>

                {config.enabled && (
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Match Fields</Label>
                        <p className="text-xs text-muted-foreground">
                            Check for duplicates using these fields.
                        </p>
                        {MATCH_FIELDS.map((field) => (
                            <label key={field.value} className="flex items-start gap-3 py-1">
                                <Checkbox
                                    checked={config.matchFields.includes(field.value)}
                                    onCheckedChange={(checked) => toggleField(field.value, !!checked)}
                                    className="mt-0.5"
                                />
                                <div>
                                    <span className="text-sm font-medium">{field.label}</span>
                                    <p className="text-xs text-muted-foreground">{field.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Detection Settings
                </Button>
            </CardFooter>
        </Card>
    );
}
