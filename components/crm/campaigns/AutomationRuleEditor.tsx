'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const LEAD_STATUSES = [
    'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED',
    'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED',
];

const TRIGGER_TYPES = [
    { value: 'status_change', label: 'Lead Status Change' },
    { value: 'new_lead', label: 'New Lead Created' },
    { value: 'tag_added', label: 'Tag Added' },
];

interface Template {
    id: string;
    name: string;
    channel: 'SMS' | 'EMAIL';
    subject: string | null;
    body: string;
}

interface Props {
    rule: any | null; // null = create new
    onClose: () => void;
    onSaved: () => void;
}

export default function AutomationRuleEditor({ rule, onClose, onSaved }: Props) {
    const [form, setForm] = useState({
        name: rule?.name || '',
        channel: (rule?.channel || 'SMS') as 'SMS' | 'EMAIL',
        triggerType: rule?.triggerType || 'status_change',
        triggerValue: rule?.triggerValue || {},
        templateId: rule?.templateId || '',
        subject: rule?.subject || '',
        body: rule?.body || '',
    });

    const { data: templates = [] } = useQuery<Template[]>({
        queryKey: ['message-templates'],
        queryFn: () => fetch('/api/crm/templates').then((r) => r.json()),
    });

    const filteredTemplates = templates.filter((t) => t.channel === form.channel);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const url = rule ? `/api/crm/automations/${rule.id}` : '/api/crm/automations';
            const method = rule ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    channel: form.channel,
                    triggerType: form.triggerType,
                    triggerValue: form.triggerValue,
                    templateId: form.templateId || null,
                    subject: form.subject || null,
                    body: form.body || null,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(rule ? 'Rule updated' : 'Rule created');
            onSaved();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    function updateTriggerValue(key: string, value: string) {
        setForm((prev) => ({
            ...prev,
            triggerValue: { ...prev.triggerValue, [key]: value || undefined },
        }));
    }

    function applyTemplate(templateId: string) {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setForm((prev) => ({
                ...prev,
                templateId,
                subject: template.subject || '',
                body: template.body,
            }));
        } else {
            setForm((prev) => ({ ...prev, templateId: '' }));
        }
    }

    const isValid = form.name.trim() && (form.templateId || form.body.trim());

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Edit Automation Rule' : 'New Automation Rule'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Name + Channel */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Rule Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Welcome SMS on Contact"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Channel</label>
                            <Select
                                value={form.channel}
                                onValueChange={(v) => setForm({ ...form, channel: v as 'SMS' | 'EMAIL', templateId: '' })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SMS">SMS</SelectItem>
                                    <SelectItem value="EMAIL">Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Trigger Type */}
                    <div>
                        <label className="text-sm font-medium">Trigger</label>
                        <Select
                            value={form.triggerType}
                            onValueChange={(v) => setForm({ ...form, triggerType: v, triggerValue: {} })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TRIGGER_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Trigger config fields */}
                    {form.triggerType === 'status_change' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">From Status (optional)</label>
                                <Select
                                    value={form.triggerValue.fromStatus || ''}
                                    onValueChange={(v) => updateTriggerValue('fromStatus', v)}
                                >
                                    <SelectTrigger className="h-8"><SelectValue placeholder="Any" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Any</SelectItem>
                                        {LEAD_STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">To Status</label>
                                <Select
                                    value={form.triggerValue.toStatus || ''}
                                    onValueChange={(v) => updateTriggerValue('toStatus', v)}
                                >
                                    <SelectTrigger className="h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {LEAD_STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {form.triggerType === 'tag_added' && (
                        <div>
                            <label className="text-xs text-muted-foreground">Tag</label>
                            <Input
                                value={form.triggerValue.tag || ''}
                                onChange={(e) => updateTriggerValue('tag', e.target.value)}
                                placeholder="Tag name to match"
                            />
                        </div>
                    )}

                    {/* Template / Message */}
                    <div className="border-t pt-3">
                        <label className="text-sm font-medium">Message</label>
                        {filteredTemplates.length > 0 && (
                            <Select value={form.templateId} onValueChange={applyTemplate}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select template or write custom..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Custom message</SelectItem>
                                    {filteredTemplates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {form.channel === 'EMAIL' && (
                            <Input
                                className="mt-2"
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                placeholder="Email subject"
                            />
                        )}

                        <Textarea
                            className="mt-2"
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            placeholder={form.channel === 'SMS' ? 'SMS text...' : 'Email body...'}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Supports: {'{{firstName}}, {{lastName}}, {{leadNumber}}, {{phone}}, {{email}}'}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
                        {saveMutation.isPending ? 'Saving...' : rule ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
