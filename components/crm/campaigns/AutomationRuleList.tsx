'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Zap, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';
import AutomationRuleEditor from './AutomationRuleEditor';

interface AutomationRule {
    id: string;
    name: string;
    enabled: boolean;
    channel: 'SMS' | 'EMAIL';
    triggerType: string;
    triggerValue: Record<string, any>;
    templateId: string | null;
    subject: string | null;
    body: string | null;
    template?: { name: string } | null;
    createdBy?: { firstName: string; lastName: string };
}

const TRIGGER_LABELS: Record<string, string> = {
    status_change: 'Lead Status Change',
    new_lead: 'New Lead Created',
    tag_added: 'Tag Added',
    no_contact_days: 'No Contact (Days)',
};

function describeTrigger(rule: AutomationRule): string {
    const label = TRIGGER_LABELS[rule.triggerType] || rule.triggerType;
    const tv = rule.triggerValue;

    if (rule.triggerType === 'status_change') {
        const from = tv.fromStatus ? `from ${tv.fromStatus}` : '';
        const to = tv.toStatus ? `to ${tv.toStatus}` : '';
        return `${label} ${from} ${to}`.trim();
    }
    if (rule.triggerType === 'no_contact_days') {
        return `${label}: ${tv.days || '?'} days`;
    }
    if (rule.triggerType === 'tag_added') {
        return `${label}: "${tv.tag || '?'}"`;
    }
    return label;
}

export default function AutomationRuleList() {
    const queryClient = useQueryClient();
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

    const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
        queryKey: ['automation-rules'],
        queryFn: () => fetch('/api/crm/automations').then((r) => r.json()),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            fetch(`/api/crm/automations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            }).then((r) => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/crm/automations/${id}`, { method: 'DELETE' }).then((r) => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
            toast.success('Rule deleted');
        },
    });

    function openNew() {
        setEditingRule(null);
        setEditorOpen(true);
    }

    function openEdit(rule: AutomationRule) {
        setEditingRule(rule);
        setEditorOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold">Automation Rules</h3>
                </div>
                <Button onClick={openNew} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New Rule
                </Button>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
            ) : rules.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <p className="mb-2">No automation rules yet</p>
                        <p className="text-sm">
                            Rules automatically send SMS or email when lead events occur.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">On</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <Switch
                                            checked={rule.enabled}
                                            onCheckedChange={(checked) =>
                                                toggleMutation.mutate({ id: rule.id, enabled: checked })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {describeTrigger(rule)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {rule.channel === 'SMS' ? (
                                            <div className="flex items-center gap-1 text-green-600 text-sm">
                                                <MessageSquare className="h-3.5 w-3.5" /> SMS
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-blue-600 text-sm">
                                                <Mail className="h-3.5 w-3.5" /> Email
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {rule.template?.name || 'Custom'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="sm"
                                                onClick={() => {
                                                    if (confirm('Delete this rule?')) deleteMutation.mutate(rule.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {editorOpen && (
                <AutomationRuleEditor
                    rule={editingRule}
                    onClose={() => setEditorOpen(false)}
                    onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
                        setEditorOpen(false);
                    }}
                />
            )}
        </div>
    );
}
