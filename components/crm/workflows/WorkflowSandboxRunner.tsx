'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    leadNumber: string;
    status: string;
}

interface ExecutionStep {
    id: string;
    nodeType: string;
    status: string;
    output: Record<string, any> | null;
    executedAt: string;
}

interface ExecutionResult {
    id: string;
    status: string;
    error: string | null;
    steps: ExecutionStep[];
}

const STATUS_ICONS: Record<string, React.ElementType> = {
    success: CheckCircle,
    failed: XCircle,
    skipped: AlertTriangle,
};

const STATUS_COLORS: Record<string, string> = {
    success: 'text-green-600',
    failed: 'text-red-600',
    skipped: 'text-amber-600',
};

interface Props {
    workflowId: string;
    open: boolean;
    onClose: () => void;
}

export default function WorkflowSandboxRunner({ workflowId, open, onClose }: Props) {
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [result, setResult] = useState<ExecutionResult | null>(null);

    const { data: leads = [] } = useQuery<Lead[]>({
        queryKey: ['leads-for-test'],
        queryFn: async () => {
            const res = await fetch('/api/crm/leads?limit=50');
            const data = await res.json();
            return data.leads || data;
        },
        enabled: open,
    });

    const runMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/crm/workflows/${workflowId}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: selectedLeadId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Test run failed');
            }
            return res.json();
        },
        onSuccess: (data) => {
            setResult(data);
            toast.success('Test run completed');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Sandbox Test Run</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Select a lead to test with</Label>
                        <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                            <SelectTrigger><SelectValue placeholder="Choose a lead..." /></SelectTrigger>
                            <SelectContent>
                                {leads.map(lead => (
                                    <SelectItem key={lead.id} value={lead.id}>
                                        {lead.leadNumber} — {lead.firstName} {lead.lastName} ({lead.status})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={() => runMutation.mutate()}
                        disabled={!selectedLeadId || runMutation.isPending}
                        className="w-full"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {runMutation.isPending ? 'Running...' : 'Run Workflow'}
                    </Button>

                    {result && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Result:</span>
                                <Badge variant={result.status === 'COMPLETED' ? 'default' : 'destructive'}>
                                    {result.status}
                                </Badge>
                                {result.error && (
                                    <span className="text-xs text-red-600">{result.error}</span>
                                )}
                            </div>

                            <ScrollArea className="h-[300px]">
                                <div className="space-y-2">
                                    {result.steps.map((step, i) => {
                                        const StepIcon = STATUS_ICONS[step.status] || Clock;
                                        const color = STATUS_COLORS[step.status] || 'text-gray-500';
                                        return (
                                            <div key={step.id} className="flex items-start gap-3 p-2 rounded-md border bg-muted/30">
                                                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                                                    <StepIcon className={`h-4 w-4 ${color}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{step.nodeType.replace(/_/g, ' ')}</span>
                                                        <Badge variant="outline" className="text-[10px]">{step.status}</Badge>
                                                    </div>
                                                    {step.output && (
                                                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                                                            {JSON.stringify(step.output, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
