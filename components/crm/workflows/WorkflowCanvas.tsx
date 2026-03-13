'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, ArrowLeft, Play, Save, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import WorkflowNodeCard from './WorkflowNodeCard';
import WorkflowNodeTypePicker, { type WorkflowNodeTypeValue } from './WorkflowNodeTypePicker';
import WorkflowNodeConfigPanel from './WorkflowNodeConfigPanel';
import WorkflowTriggerEditor from './WorkflowTriggerEditor';
import WorkflowSandboxRunner from './WorkflowSandboxRunner';

interface WorkflowNode {
    id: string;
    nodeType: WorkflowNodeTypeValue | 'TRIGGER';
    label: string;
    config: Record<string, any>;
    sortOrder: number;
    nextNodeId: string | null;
    yesNodeId: string | null;
    noNodeId: string | null;
}

interface Workflow {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    mode: 'SANDBOX' | 'LIVE';
    triggerType: string;
    triggerValue: Record<string, any>;
    nodes: WorkflowNode[];
    _count: { executions: number };
}

const DEFAULT_LABELS: Record<string, string> = {
    AI_WRITE_SMS: 'AI Write SMS',
    AI_WRITE_EMAIL: 'AI Write Email',
    AI_SCORE: 'AI Score Lead',
    AI_BRANCH: 'AI Branch',
    SEND_SMS: 'Send SMS',
    SEND_EMAIL: 'Send Email',
    DELAY: 'Wait',
    UPDATE_STATUS: 'Update Status',
    ADD_TAG: 'Add Tag',
    ASSIGN_LEAD: 'Assign Lead',
    END: 'End',
};

interface Props {
    workflowId: string;
    onBack: () => void;
}

export default function WorkflowCanvas({ workflowId, onBack }: Props) {
    const queryClient = useQueryClient();
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [showAddNode, setShowAddNode] = useState(false);
    const [showTestRunner, setShowTestRunner] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState('');

    const { data: workflow, isLoading } = useQuery<Workflow>({
        queryKey: ['workflow', workflowId],
        queryFn: () => fetch(`/api/crm/workflows/${workflowId}`).then(r => r.json()),
    });

    const updateWorkflow = useMutation({
        mutationFn: async (data: Partial<Workflow>) => {
            const res = await fetch(`/api/crm/workflows/${workflowId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
            toast.success('Workflow updated');
        },
    });

    const addNode = useMutation({
        mutationFn: async (nodeType: WorkflowNodeTypeValue) => {
            const sortOrder = (workflow?.nodes.length ?? 0) + 1;
            const res = await fetch(`/api/crm/workflows/${workflowId}/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodeType,
                    label: DEFAULT_LABELS[nodeType] || nodeType,
                    sortOrder,
                    config: {},
                }),
            });
            if (!res.ok) throw new Error('Failed to add node');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
            toast.success('Node added');
        },
    });

    const deleteNode = useMutation({
        mutationFn: async (nodeId: string) => {
            const res = await fetch(`/api/crm/workflows/${workflowId}/nodes/${nodeId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
            setSelectedNodeId(null);
            toast.success('Node removed');
        },
    });

    if (isLoading || !workflow) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading workflow...</div>;
    }

    const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId) || null;

    // Build a virtual trigger node from workflow trigger config
    const triggerNode: WorkflowNode = {
        id: '__trigger__',
        nodeType: 'TRIGGER',
        label: 'Trigger',
        config: { triggerType: workflow.triggerType, ...workflow.triggerValue },
        sortOrder: -1,
        nextNodeId: null,
        yesNodeId: null,
        noNodeId: null,
    };

    return (
        <div className="space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {editingName ? (
                        <Input
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onBlur={() => {
                                if (nameValue.trim()) updateWorkflow.mutate({ name: nameValue.trim() });
                                setEditingName(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (nameValue.trim()) updateWorkflow.mutate({ name: nameValue.trim() });
                                    setEditingName(false);
                                }
                            }}
                            autoFocus
                            className="text-lg font-semibold w-64"
                        />
                    ) : (
                        <h2
                            className="text-lg font-semibold cursor-pointer hover:text-primary"
                            onClick={() => { setNameValue(workflow.name); setEditingName(true); }}
                        >
                            {workflow.name}
                        </h2>
                    )}
                    <Badge variant={workflow.mode === 'LIVE' ? 'default' : 'secondary'}>
                        {workflow.mode}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <span className="text-sm text-muted-foreground">
                            {workflow.mode === 'SANDBOX' ? 'Sandbox' : 'Live'}
                        </span>
                        <Switch
                            checked={workflow.mode === 'LIVE'}
                            onCheckedChange={(checked) => updateWorkflow.mutate({ mode: checked ? 'LIVE' : 'SANDBOX' })}
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowTestRunner(true)}>
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Test Run
                    </Button>
                    <Button
                        size="sm"
                        variant={workflow.isActive ? 'destructive' : 'default'}
                        onClick={() => updateWorkflow.mutate({ isActive: !workflow.isActive })}
                    >
                        {workflow.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Trigger configuration */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Workflow Trigger</h3>
                    <WorkflowTriggerEditor
                        triggerType={workflow.triggerType}
                        triggerValue={workflow.triggerValue}
                        onChange={(type, value) => updateWorkflow.mutate({ triggerType: type, triggerValue: value })}
                    />
                </CardContent>
            </Card>

            {/* Vertical node list */}
            <div className="flex flex-col items-center gap-1">
                <WorkflowNodeCard
                    node={triggerNode}
                    isSelected={false}
                    onSelect={() => {}}
                />

                {workflow.nodes
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((node) => (
                        <div key={node.id} className="flex flex-col items-center w-full max-w-md">
                            <ArrowDown className="h-4 w-4 text-muted-foreground my-1" />
                            <div className="w-full">
                                <WorkflowNodeCard
                                    node={node}
                                    isSelected={selectedNodeId === node.id}
                                    onSelect={() => setSelectedNodeId(node.id)}
                                    onDelete={() => deleteNode.mutate(node.id)}
                                />
                            </div>
                        </div>
                    ))}

                <ArrowDown className="h-4 w-4 text-muted-foreground my-1" />

                <Button
                    variant="outline"
                    className="w-full max-w-md border-dashed"
                    onClick={() => setShowAddNode(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                </Button>
            </div>

            {/* Modals / Panels */}
            <WorkflowNodeTypePicker
                open={showAddNode}
                onClose={() => setShowAddNode(false)}
                onSelect={(type) => addNode.mutate(type)}
            />

            <WorkflowNodeConfigPanel
                workflowId={workflowId}
                node={selectedNode}
                open={!!selectedNode}
                onClose={() => setSelectedNodeId(null)}
            />

            <WorkflowSandboxRunner
                workflowId={workflowId}
                open={showTestRunner}
                onClose={() => setShowTestRunner(false)}
            />
        </div>
    );
}
