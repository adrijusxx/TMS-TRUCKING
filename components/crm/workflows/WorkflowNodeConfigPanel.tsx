'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const LEAD_STATUSES = [
    'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING',
    'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED',
];

const TONES = ['professional', 'casual', 'urgent'] as const;
const BRANCH_CONDITIONS = [
    { value: 'ai_score_gte', label: 'AI Score >=' },
    { value: 'ai_score_lte', label: 'AI Score <=' },
    { value: 'ai_recommendation', label: 'AI Recommendation matches' },
    { value: 'tag_exists', label: 'Has tag' },
];

interface NodeData {
    id: string;
    nodeType: string;
    label: string;
    config: Record<string, any>;
}

interface Props {
    workflowId: string;
    node: NodeData | null;
    open: boolean;
    onClose: () => void;
}

export default function WorkflowNodeConfigPanel({ workflowId, node, open, onClose }: Props) {
    const queryClient = useQueryClient();
    const [label, setLabel] = useState('');
    const [config, setConfig] = useState<Record<string, any>>({});

    useEffect(() => {
        if (node) {
            setLabel(node.label);
            setConfig(node.config || {});
        }
    }, [node]);

    const { data: templates = [] } = useQuery<{ id: string; name: string; channel: string }[]>({
        queryKey: ['message-templates'],
        queryFn: () => fetch('/api/crm/templates').then(r => r.json()),
        enabled: open && (node?.nodeType === 'SEND_SMS' || node?.nodeType === 'SEND_EMAIL'),
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/crm/workflows/${workflowId}/nodes/${node!.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, config }),
            });
            if (!res.ok) throw new Error('Failed to update node');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
            toast.success('Node updated');
            onClose();
        },
        onError: () => toast.error('Failed to update node'),
    });

    if (!node) return null;

    const updateConfig = (key: string, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-[400px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Configure: {node.nodeType.replace(/_/g, ' ')}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                    <div>
                        <Label>Label</Label>
                        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
                    </div>

                    {/* DELAY config */}
                    {node.nodeType === 'DELAY' && (
                        <>
                            <div>
                                <Label>Days</Label>
                                <Input type="number" min={0} value={config.days ?? 0} onChange={(e) => updateConfig('days', parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label>Hours</Label>
                                <Input type="number" min={0} max={23} value={config.hours ?? 0} onChange={(e) => updateConfig('hours', parseInt(e.target.value) || 0)} />
                            </div>
                        </>
                    )}

                    {/* AI Write config */}
                    {(node.nodeType === 'AI_WRITE_SMS' || node.nodeType === 'AI_WRITE_EMAIL') && (
                        <>
                            <div>
                                <Label>Tone</Label>
                                <Select value={config.tone || 'professional'} onValueChange={(v) => updateConfig('tone', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Goal</Label>
                                <Textarea
                                    value={config.goal || ''}
                                    onChange={(e) => updateConfig('goal', e.target.value)}
                                    placeholder="e.g., Introduce company and ask about CDL class"
                                    rows={3}
                                />
                            </div>
                            {node.nodeType === 'AI_WRITE_SMS' && (
                                <div>
                                    <Label>Max characters</Label>
                                    <Input type="number" value={config.maxChars ?? 160} onChange={(e) => updateConfig('maxChars', parseInt(e.target.value) || 160)} />
                                </div>
                            )}
                        </>
                    )}

                    {/* AI Score config */}
                    {node.nodeType === 'AI_SCORE' && (
                        <div className="flex items-center gap-2">
                            <Switch checked={config.forceRescore ?? false} onCheckedChange={(v) => updateConfig('forceRescore', v)} />
                            <Label>Force rescore (even if already scored)</Label>
                        </div>
                    )}

                    {/* AI Branch config */}
                    {node.nodeType === 'AI_BRANCH' && (
                        <>
                            <div>
                                <Label>Condition</Label>
                                <Select value={config.condition || 'ai_score_gte'} onValueChange={(v) => updateConfig('condition', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {BRANCH_CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Value</Label>
                                <Input value={config.value ?? ''} onChange={(e) => updateConfig('value', e.target.value)} placeholder="e.g., 70 or HIRE" />
                            </div>
                        </>
                    )}

                    {/* Update Status config */}
                    {node.nodeType === 'UPDATE_STATUS' && (
                        <div>
                            <Label>New Status</Label>
                            <Select value={config.status || ''} onValueChange={(v) => updateConfig('status', v)}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Add Tag config */}
                    {node.nodeType === 'ADD_TAG' && (
                        <div>
                            <Label>Tag</Label>
                            <Input value={config.tag || ''} onChange={(e) => updateConfig('tag', e.target.value)} placeholder="e.g., hot-lead" />
                        </div>
                    )}

                    {/* Send SMS / Email config */}
                    {(node.nodeType === 'SEND_SMS' || node.nodeType === 'SEND_EMAIL') && (
                        <>
                            <div>
                                <Label>Template (optional)</Label>
                                <Select value={config.templateId || '_none'} onValueChange={(v) => updateConfig('templateId', v === '_none' ? null : v)}>
                                    <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">No template</SelectItem>
                                        {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {!config.templateId && (
                                <>
                                    {node.nodeType === 'SEND_EMAIL' && (
                                        <div>
                                            <Label>Subject</Label>
                                            <Input value={config.subject || ''} onChange={(e) => updateConfig('subject', e.target.value)} />
                                        </div>
                                    )}
                                    <div>
                                        <Label>Message Body</Label>
                                        <Textarea
                                            value={config.body || ''}
                                            onChange={(e) => updateConfig('body', e.target.value)}
                                            placeholder="Use {{firstName}}, {{lastName}}, {{leadNumber}} placeholders"
                                            rows={4}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Assign Lead config */}
                    {node.nodeType === 'ASSIGN_LEAD' && (
                        <div>
                            <Label>Assignment</Label>
                            <Select value={config.assignedToId || 'round_robin'} onValueChange={(v) => updateConfig('assignedToId', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="round_robin">Round Robin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full">
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
