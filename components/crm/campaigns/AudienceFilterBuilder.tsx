'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Users, RefreshCw } from 'lucide-react';

const LEAD_STATUSES = [
    'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED',
    'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED',
];

const LEAD_SOURCES = ['FACEBOOK', 'REFERRAL', 'DIRECT', 'WEBSITE', 'APPLICATION', 'OTHER'];
const LEAD_PRIORITIES = ['HOT', 'WARM', 'COLD'];

interface AudienceFilter {
    status?: string[];
    source?: string[];
    priority?: string[];
    tags?: string[];
}

interface Props {
    filter: AudienceFilter;
    onChange: (filter: AudienceFilter) => void;
    channel: 'SMS' | 'EMAIL';
}

export default function AudienceFilterBuilder({ filter, onChange, channel }: Props) {
    const [preview, setPreview] = useState<{ total: number; withContact: number } | null>(null);
    const [previewing, setPreviewing] = useState(false);

    function toggleArrayValue(key: keyof AudienceFilter, value: string) {
        const current = (filter[key] as string[]) || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        onChange({ ...filter, [key]: updated.length ? updated : undefined });
        setPreview(null); // Reset preview on change
    }

    async function fetchPreview() {
        setPreviewing(true);
        try {
            const res = await fetch('/api/crm/campaigns/new/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audienceFilter: filter, channel }),
            });
            if (res.ok) {
                setPreview(await res.json());
            }
        } finally {
            setPreviewing(false);
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> Audience Filter
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status filter */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Status</label>
                    <div className="flex flex-wrap gap-1.5">
                        {LEAD_STATUSES.map((s) => (
                            <Badge
                                key={s}
                                variant={filter.status?.includes(s) ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => toggleArrayValue('status', s)}
                            >
                                {s.replace(/_/g, ' ')}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Source filter */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Source</label>
                    <div className="flex flex-wrap gap-1.5">
                        {LEAD_SOURCES.map((s) => (
                            <Badge
                                key={s}
                                variant={filter.source?.includes(s) ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => toggleArrayValue('source', s)}
                            >
                                {s}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Priority filter */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                    <div className="flex flex-wrap gap-1.5">
                        {LEAD_PRIORITIES.map((p) => (
                            <Badge
                                key={p}
                                variant={filter.priority?.includes(p) ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => toggleArrayValue('priority', p)}
                            >
                                {p}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Preview button */}
                <div className="flex items-center gap-3 pt-2 border-t">
                    <Button
                        variant="outline" size="sm"
                        onClick={fetchPreview}
                        disabled={previewing}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${previewing ? 'animate-spin' : ''}`} />
                        Preview Audience
                    </Button>
                    {preview && (
                        <p className="text-sm">
                            <span className="font-medium">{preview.total}</span> leads match
                            {preview.withContact < preview.total && (
                                <span className="text-muted-foreground">
                                    {' '}({preview.withContact} with {channel === 'SMS' ? 'phone' : 'email'})
                                </span>
                            )}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
