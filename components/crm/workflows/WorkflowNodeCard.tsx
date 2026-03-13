'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare, Mail, Brain, GitBranch, Clock, RefreshCw,
    Tag, UserPlus, Target, StopCircle, Zap, Trash2,
} from 'lucide-react';
import { type WorkflowNodeTypeValue } from './WorkflowNodeTypePicker';

interface WorkflowNodeData {
    id: string;
    nodeType: WorkflowNodeTypeValue | 'TRIGGER';
    label: string;
    config: Record<string, any>;
    sortOrder: number;
    nextNodeId: string | null;
    yesNodeId: string | null;
    noNodeId: string | null;
}

const NODE_STYLES: Record<string, { icon: React.ElementType; stripe: string; bg: string }> = {
    TRIGGER: { icon: Zap, stripe: 'bg-indigo-500', bg: 'bg-indigo-50' },
    SEND_SMS: { icon: MessageSquare, stripe: 'bg-blue-500', bg: 'bg-blue-50' },
    SEND_EMAIL: { icon: Mail, stripe: 'bg-blue-500', bg: 'bg-blue-50' },
    AI_WRITE_SMS: { icon: Brain, stripe: 'bg-purple-500', bg: 'bg-purple-50' },
    AI_WRITE_EMAIL: { icon: Brain, stripe: 'bg-purple-500', bg: 'bg-purple-50' },
    AI_SCORE: { icon: Target, stripe: 'bg-purple-500', bg: 'bg-purple-50' },
    AI_BRANCH: { icon: GitBranch, stripe: 'bg-orange-500', bg: 'bg-orange-50' },
    DELAY: { icon: Clock, stripe: 'bg-amber-500', bg: 'bg-amber-50' },
    UPDATE_STATUS: { icon: RefreshCw, stripe: 'bg-green-500', bg: 'bg-green-50' },
    ADD_TAG: { icon: Tag, stripe: 'bg-green-500', bg: 'bg-green-50' },
    ASSIGN_LEAD: { icon: UserPlus, stripe: 'bg-green-500', bg: 'bg-green-50' },
    END: { icon: StopCircle, stripe: 'bg-gray-400', bg: 'bg-gray-50' },
};

const AI_TYPES = new Set(['AI_WRITE_SMS', 'AI_WRITE_EMAIL', 'AI_SCORE', 'AI_BRANCH']);

function getConfigSummary(nodeType: string, config: Record<string, any>): string {
    switch (nodeType) {
        case 'DELAY':
            return `Wait ${config.days || 0}d ${config.hours || 0}h`;
        case 'AI_WRITE_SMS':
        case 'AI_WRITE_EMAIL':
            return `${config.tone || 'professional'} tone — ${config.goal || 'Outreach'}`;
        case 'AI_BRANCH':
            return `If ${config.condition || 'ai_score_gte'} ${config.value ?? 70}`;
        case 'AI_SCORE':
            return config.forceRescore ? 'Force rescore' : 'Score if needed';
        case 'UPDATE_STATUS':
            return `→ ${config.status || '?'}`;
        case 'ADD_TAG':
            return `+ ${config.tag || '?'}`;
        case 'ASSIGN_LEAD':
            return config.assignedToId === 'round_robin' ? 'Round robin' : 'Specific recruiter';
        case 'SEND_SMS':
        case 'SEND_EMAIL':
            return config.templateId ? 'Using template' : (config.body ? 'Custom message' : 'Not configured');
        case 'TRIGGER':
            return `On: ${config.triggerType || 'new_lead'}`;
        default:
            return '';
    }
}

interface Props {
    node: WorkflowNodeData;
    isSelected: boolean;
    onSelect: () => void;
    onDelete?: () => void;
}

export default function WorkflowNodeCard({ node, isSelected, onSelect, onDelete }: Props) {
    const style = NODE_STYLES[node.nodeType] || NODE_STYLES.END;
    const Icon = style.icon;
    const isAI = AI_TYPES.has(node.nodeType);

    return (
        <Card
            className={`relative cursor-pointer transition-all overflow-hidden ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
            onClick={onSelect}
        >
            <div className="flex">
                <div className={`w-1.5 shrink-0 ${style.stripe}`} />
                <div className="flex-1 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${style.bg}`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-sm">{node.label}</span>
                                    {isAI && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-purple-100 text-purple-700">
                                            AI
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {getConfigSummary(node.nodeType, node.config)}
                                </p>
                            </div>
                        </div>
                        {onDelete && node.nodeType !== 'TRIGGER' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                    {node.nodeType === 'AI_BRANCH' && (
                        <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-green-600">Yes → {node.yesNodeId ? 'connected' : 'not set'}</span>
                            <span className="text-red-600">No → {node.noNodeId ? 'connected' : 'not set'}</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
