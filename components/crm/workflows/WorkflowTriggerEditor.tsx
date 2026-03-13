'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TRIGGER_TYPES = [
    { value: 'new_lead', label: 'New Lead Created' },
    { value: 'status_change', label: 'Lead Status Changed' },
    { value: 'tag_added', label: 'Tag Added to Lead' },
    { value: 'ai_score_threshold', label: 'AI Score Threshold' },
];

const LEAD_STATUSES = [
    'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING',
    'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED',
];

const LEAD_SOURCES = [
    'APPLICATION', 'REFERRAL', 'FACEBOOK', 'INDEED', 'CRAIGSLIST',
    'WEBSITE', 'COLD_CALL', 'OTHER',
];

interface Props {
    triggerType: string;
    triggerValue: Record<string, any>;
    onChange: (triggerType: string, triggerValue: Record<string, any>) => void;
}

export default function WorkflowTriggerEditor({ triggerType, triggerValue, onChange }: Props) {
    return (
        <div className="space-y-3">
            <div>
                <Label>When this happens:</Label>
                <Select value={triggerType} onValueChange={(v) => onChange(v, {})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {TRIGGER_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {triggerType === 'new_lead' && (
                <div>
                    <Label>Filter by source (optional)</Label>
                    <Select
                        value={triggerValue.source || '_any'}
                        onValueChange={(v) => onChange(triggerType, v === '_any' ? {} : { source: v })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_any">Any source</SelectItem>
                            {LEAD_SOURCES.map(s => (
                                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {triggerType === 'status_change' && (
                <>
                    <div>
                        <Label>From status (optional)</Label>
                        <Select
                            value={triggerValue.fromStatus || '_any'}
                            onValueChange={(v) => onChange(triggerType, { ...triggerValue, fromStatus: v === '_any' ? undefined : v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_any">Any status</SelectItem>
                                {LEAD_STATUSES.map(s => (
                                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>To status</Label>
                        <Select
                            value={triggerValue.toStatus || ''}
                            onValueChange={(v) => onChange(triggerType, { ...triggerValue, toStatus: v })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                {LEAD_STATUSES.map(s => (
                                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            {triggerType === 'tag_added' && (
                <div>
                    <Label>Tag name</Label>
                    <Input
                        value={triggerValue.tag || ''}
                        onChange={(e) => onChange(triggerType, { tag: e.target.value })}
                        placeholder="e.g., cdl-a"
                    />
                </div>
            )}

            {triggerType === 'ai_score_threshold' && (
                <div>
                    <Label>Minimum AI score</Label>
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        value={triggerValue.minScore ?? 70}
                        onChange={(e) => onChange(triggerType, { minScore: parseInt(e.target.value) || 0 })}
                    />
                </div>
            )}
        </div>
    );
}
