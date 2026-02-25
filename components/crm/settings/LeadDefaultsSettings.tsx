'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, Settings2, X } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
];

const PRIORITY_OPTIONS = [
    { value: 'HOT', label: 'Hot' },
    { value: 'WARM', label: 'Warm' },
    { value: 'COLD', label: 'Cold' },
];

export default function LeadDefaultsSettings() {
    const queryClient = useQueryClient();
    const [defaultStatus, setDefaultStatus] = useState('NEW');
    const [defaultPriority, setDefaultPriority] = useState('WARM');
    const [defaultTags, setDefaultTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['crm-general-settings'],
        queryFn: async () => {
            const res = await fetch('/api/crm/settings/general');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    useEffect(() => {
        if (data?.crm) {
            setDefaultStatus(data.crm.defaultLeadStatus || 'NEW');
            setDefaultPriority(data.crm.defaultLeadPriority || 'WARM');
            setDefaultTags(data.crm.defaultTags || []);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/settings/general', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crm: {
                        defaultLeadStatus: defaultStatus,
                        defaultLeadPriority: defaultPriority,
                        defaultTags,
                    },
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Lead defaults saved');
            queryClient.invalidateQueries({ queryKey: ['crm-general-settings'] });
        },
        onError: () => toast.error('Failed to save lead defaults'),
    });

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !defaultTags.includes(tag)) {
            setDefaultTags((prev) => [...prev, tag]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        setDefaultTags((prev) => prev.filter((t) => t !== tag));
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
                    <Settings2 className="h-5 w-5" />
                    Lead Defaults
                </CardTitle>
                <CardDescription>
                    Default values applied to new leads when no explicit value is provided.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Default Status</Label>
                        <Select value={defaultStatus} onValueChange={setDefaultStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Default Priority</Label>
                        <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">Default Tags</Label>
                    <p className="text-xs text-muted-foreground">
                        Tags automatically applied to new leads.
                    </p>
                    <div className="flex items-center gap-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Add a tag..."
                            className="max-w-xs"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag();
                                }
                            }}
                        />
                        <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                            Add
                        </Button>
                    </div>
                    {defaultTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {defaultTags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs gap-1">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Defaults
                </Button>
            </CardFooter>
        </Card>
    );
}
