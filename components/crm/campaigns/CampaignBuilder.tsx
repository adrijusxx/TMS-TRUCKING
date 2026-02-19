'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, GripVertical, Copy } from 'lucide-react';
import { toast } from 'sonner';
import AudienceFilterBuilder from './AudienceFilterBuilder';

interface StepForm {
    templateId: string;
    subject: string;
    body: string;
    delayDays: number;
    delayHours: number;
}

interface Template {
    id: string;
    name: string;
    channel: 'SMS' | 'EMAIL';
    subject: string | null;
    body: string;
}

interface Props {
    onBack: () => void;
    onCreated: () => void;
}

const PLACEHOLDERS = ['{{firstName}}', '{{lastName}}', '{{fullName}}', '{{leadNumber}}'];

const emptyStep = (): StepForm => ({
    templateId: '', subject: '', body: '', delayDays: 0, delayHours: 0,
});

export default function CampaignBuilder({ onBack, onCreated }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [channel, setChannel] = useState<'SMS' | 'EMAIL'>('SMS');
    const [isDrip, setIsDrip] = useState(false);
    const [audienceFilter, setAudienceFilter] = useState<Record<string, any>>({});
    const [steps, setSteps] = useState<StepForm[]>([emptyStep()]);

    const { data: templates = [] } = useQuery<Template[]>({
        queryKey: ['message-templates'],
        queryFn: () => fetch('/api/crm/templates').then((r) => r.json()),
    });

    const filteredTemplates = templates.filter((t) => t.channel === channel);

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, description, channel, isDrip, audienceFilter,
                    steps: steps.map((s) => ({
                        templateId: s.templateId || undefined,
                        subject: s.subject || undefined,
                        body: s.body || undefined,
                        delayDays: s.delayDays,
                        delayHours: s.delayHours,
                    })),
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create campaign');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Campaign created as draft');
            onCreated();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    function updateStep(index: number, updates: Partial<StepForm>) {
        setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
    }

    function applyTemplate(index: number, templateId: string) {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            updateStep(index, {
                templateId,
                subject: template.subject || '',
                body: template.body,
            });
        } else {
            updateStep(index, { templateId: '' });
        }
    }

    function addStep() {
        setSteps((prev) => [...prev, emptyStep()]);
    }

    function removeStep(index: number) {
        if (steps.length <= 1) return;
        setSteps((prev) => prev.filter((_, i) => i !== index));
    }

    function insertPlaceholder(index: number, placeholder: string) {
        const step = steps[index];
        updateStep(index, { body: step.body + placeholder });
    }

    const isValid = name.trim() && steps.every((s) => s.templateId || s.body.trim());

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <h2 className="text-lg font-semibold">Create Campaign</h2>
            </div>

            {/* Basic info */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Lead Welcome" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Channel</label>
                            <Select value={channel} onValueChange={(v) => setChannel(v as 'SMS' | 'EMAIL')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SMS">SMS</SelectItem>
                                    <SelectItem value="EMAIL">Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description (optional)</label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch checked={isDrip} onCheckedChange={setIsDrip} />
                        <label className="text-sm">
                            <span className="font-medium">Drip Campaign</span>
                            <span className="text-muted-foreground"> — send multiple messages with delays</span>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Audience */}
            <AudienceFilterBuilder filter={audienceFilter} onChange={setAudienceFilter} channel={channel} />

            {/* Steps */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                        {isDrip ? 'Drip Steps' : 'Message'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {steps.map((step, i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isDrip && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                                    <span className="text-sm font-medium">Step {i + 1}</span>
                                </div>
                                {steps.length > 1 && (
                                    <Button variant="ghost" size="sm" onClick={() => removeStep(i)}>
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                )}
                            </div>

                            {isDrip && i > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Wait</label>
                                    <Input
                                        type="number" min={0} className="w-16 h-8"
                                        value={step.delayDays}
                                        onChange={(e) => updateStep(i, { delayDays: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className="text-xs text-muted-foreground">days</span>
                                    <Input
                                        type="number" min={0} max={23} className="w-16 h-8"
                                        value={step.delayHours}
                                        onChange={(e) => updateStep(i, { delayHours: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className="text-xs text-muted-foreground">hours after previous step</span>
                                </div>
                            )}

                            {/* Template picker */}
                            {filteredTemplates.length > 0 && (
                                <div>
                                    <label className="text-xs font-medium">Use Template</label>
                                    <Select
                                        value={step.templateId}
                                        onValueChange={(v) => applyTemplate(i, v)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select template or write custom..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Custom message</SelectItem>
                                            {filteredTemplates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {channel === 'EMAIL' && (
                                <div>
                                    <label className="text-xs font-medium">Subject</label>
                                    <Input
                                        value={step.subject}
                                        onChange={(e) => updateStep(i, { subject: e.target.value })}
                                        placeholder="Email subject"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium">Message Body</label>
                                <Textarea
                                    value={step.body}
                                    onChange={(e) => updateStep(i, { body: e.target.value })}
                                    placeholder={channel === 'SMS' ? 'SMS text...' : 'Email body...'}
                                    rows={4}
                                />
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {PLACEHOLDERS.map((p) => (
                                        <Button
                                            key={p} variant="outline" size="sm"
                                            className="text-xs h-5 px-1.5"
                                            onClick={() => insertPlaceholder(i, p)}
                                        >
                                            <Copy className="h-2.5 w-2.5 mr-0.5" /> {p}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isDrip && (
                        <Button variant="outline" size="sm" onClick={addStep}>
                            <Plus className="h-4 w-4 mr-1" /> Add Step
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onBack}>Cancel</Button>
                <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!isValid || createMutation.isPending}
                >
                    {createMutation.isPending ? 'Creating...' : 'Save as Draft'}
                </Button>
            </div>
        </div>
    );
}
