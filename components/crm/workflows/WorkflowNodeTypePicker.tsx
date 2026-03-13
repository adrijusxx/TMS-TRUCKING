'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    MessageSquare, Mail, Brain, GitBranch, Clock, RefreshCw,
    Tag, UserPlus, Target, StopCircle,
} from 'lucide-react';

export type WorkflowNodeTypeValue =
    | 'SEND_SMS' | 'SEND_EMAIL'
    | 'AI_WRITE_SMS' | 'AI_WRITE_EMAIL'
    | 'AI_SCORE' | 'AI_BRANCH'
    | 'DELAY' | 'UPDATE_STATUS'
    | 'ADD_TAG' | 'ASSIGN_LEAD' | 'END';

interface NodeTypeOption {
    type: WorkflowNodeTypeValue;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    isAI: boolean;
}

export const NODE_TYPE_OPTIONS: NodeTypeOption[] = [
    { type: 'AI_WRITE_SMS', label: 'AI Write SMS', description: 'AI generates personalized SMS', icon: Brain, color: 'bg-purple-100 text-purple-700', isAI: true },
    { type: 'AI_WRITE_EMAIL', label: 'AI Write Email', description: 'AI generates personalized email', icon: Brain, color: 'bg-purple-100 text-purple-700', isAI: true },
    { type: 'AI_SCORE', label: 'AI Score Lead', description: 'Run AI scoring on lead', icon: Target, color: 'bg-purple-100 text-purple-700', isAI: true },
    { type: 'AI_BRANCH', label: 'AI Branch', description: 'Branch based on AI score or condition', icon: GitBranch, color: 'bg-orange-100 text-orange-700', isAI: true },
    { type: 'SEND_SMS', label: 'Send SMS', description: 'Send a template SMS', icon: MessageSquare, color: 'bg-blue-100 text-blue-700', isAI: false },
    { type: 'SEND_EMAIL', label: 'Send Email', description: 'Send a template email', icon: Mail, color: 'bg-blue-100 text-blue-700', isAI: false },
    { type: 'DELAY', label: 'Wait / Delay', description: 'Wait before next step', icon: Clock, color: 'bg-amber-100 text-amber-700', isAI: false },
    { type: 'UPDATE_STATUS', label: 'Update Status', description: 'Change lead status', icon: RefreshCw, color: 'bg-green-100 text-green-700', isAI: false },
    { type: 'ADD_TAG', label: 'Add Tag', description: 'Add a tag to the lead', icon: Tag, color: 'bg-green-100 text-green-700', isAI: false },
    { type: 'ASSIGN_LEAD', label: 'Assign Lead', description: 'Assign to recruiter', icon: UserPlus, color: 'bg-green-100 text-green-700', isAI: false },
    { type: 'END', label: 'End Workflow', description: 'Stop workflow execution', icon: StopCircle, color: 'bg-gray-100 text-gray-700', isAI: false },
];

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (type: WorkflowNodeTypeValue) => void;
}

export default function WorkflowNodeTypePicker({ open, onClose, onSelect }: Props) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Workflow Step</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2">
                    {NODE_TYPE_OPTIONS.map((opt) => (
                        <button
                            key={opt.type}
                            onClick={() => { onSelect(opt.type); onClose(); }}
                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className={`p-2 rounded-md ${opt.color}`}>
                                <opt.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-sm">{opt.label}</span>
                                    {opt.isAI && (
                                        <span className="text-[10px] font-bold bg-purple-500 text-white px-1 rounded">AI</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
