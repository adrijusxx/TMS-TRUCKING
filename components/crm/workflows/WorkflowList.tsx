'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Workflow, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import WorkflowCanvas from './WorkflowCanvas';

interface WorkflowSummary {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    mode: 'SANDBOX' | 'LIVE';
    triggerType: string;
    totalEnrolled: number;
    totalCompleted: number;
    createdAt: string;
    createdBy?: { firstName: string; lastName: string };
    _count: { nodes: number; executions: number };
}

const TRIGGER_LABELS: Record<string, string> = {
    new_lead: 'New Lead',
    status_change: 'Status Change',
    tag_added: 'Tag Added',
    ai_score_threshold: 'AI Score Threshold',
};

export default function WorkflowList() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newTriggerType, setNewTriggerType] = useState('new_lead');

    const { data: workflows = [], isLoading } = useQuery<WorkflowSummary[]>({
        queryKey: ['workflows'],
        queryFn: () => fetch('/api/crm/workflows').then(r => r.json()),
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim() || null,
                    triggerType: newTriggerType,
                    triggerValue: {},
                }),
            });
            if (!res.ok) throw new Error('Failed to create');
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            setShowCreate(false);
            setNewName('');
            setNewDescription('');
            setSelectedId(data.id);
            setView('detail');
            toast.success('Workflow created');
        },
        onError: () => toast.error('Failed to create workflow'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/crm/workflows/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success('Workflow deleted');
        },
    });

    if (view === 'detail' && selectedId) {
        return (
            <WorkflowCanvas
                workflowId={selectedId}
                onBack={() => { setView('list'); setSelectedId(null); queryClient.invalidateQueries({ queryKey: ['workflows'] }); }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">AI Workflows</h3>
                    <p className="text-sm text-muted-foreground">Build automated recruiting sequences with AI-powered steps</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Workflow
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : workflows.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Workflow className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground mb-2">No workflows yet</p>
                        <Button variant="outline" onClick={() => setShowCreate(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create your first workflow
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead>Steps</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enrolled</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[40px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workflows.map(wf => (
                            <TableRow
                                key={wf.id}
                                className="cursor-pointer"
                                onClick={() => { setSelectedId(wf.id); setView('detail'); }}
                            >
                                <TableCell className="font-medium">{wf.name}</TableCell>
                                <TableCell>{TRIGGER_LABELS[wf.triggerType] || wf.triggerType}</TableCell>
                                <TableCell>{wf._count.nodes}</TableCell>
                                <TableCell>
                                    <Badge variant={wf.mode === 'LIVE' ? 'default' : 'secondary'}>{wf.mode}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={wf.isActive ? 'default' : 'outline'}>
                                        {wf.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{wf.totalEnrolled}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {formatDistanceToNow(new Date(wf.createdAt), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(wf.id); }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., New Facebook Lead Nurture" />
                        </div>
                        <div>
                            <Label>Description (optional)</Label>
                            <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
                        </div>
                        <div>
                            <Label>Trigger Type</Label>
                            <Select value={newTriggerType} onValueChange={setNewTriggerType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={!newName.trim() || createMutation.isPending}
                            className="w-full"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
