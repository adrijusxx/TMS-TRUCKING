'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, File, Bot, Trash2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface DocumentRowProps {
    doc: any;
    onView: () => void;
    onDelete: () => void;
    isLearned?: boolean;
    category?: string;
    agentName?: string | null;
    selected?: boolean;
    onToggle?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    READY: 'bg-green-500',
    PROCESSING: 'bg-yellow-500',
    FAILED: 'bg-red-500',
};

const CATEGORY_COLORS: Record<string, string> = {
    DISPATCH: 'bg-blue-500',
    BREAKDOWN: 'bg-red-500',
    COMPLIANCE: 'bg-purple-500',
    ONBOARDING: 'bg-green-500',
    SETTLEMENT: 'bg-yellow-500',
    GENERAL: 'bg-gray-500',
};

export default function DocumentRow({
    doc, onView, onDelete, isLearned = false, category, agentName, selected, onToggle
}: DocumentRowProps) {
    return (
        <div
            className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={onView}
        >
            <div className="flex items-center gap-4">
                {onToggle && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected} onCheckedChange={onToggle} />
                    </div>
                )}
                <div className="p-2 bg-muted rounded group-hover:bg-background transition-colors">
                    {isLearned ? (
                        <Bot className="h-6 w-6 text-blue-600" />
                    ) : doc.fileType?.includes('pdf') ? (
                        <FileText className="h-6 w-6 text-red-500" />
                    ) : (
                        <File className="h-6 w-6 text-blue-500" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{doc.title}</h4>
                        {category && (
                            <Badge variant="outline" className={`${CATEGORY_COLORS[category] || 'bg-gray-500'} text-white border-0 text-[10px] h-5`}>
                                {category}
                            </Badge>
                        )}
                        {agentName && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                                {agentName}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {!isLearned && <span>{formatBytes(doc.fileSize)}</span>}
                        {!isLearned && <span>&middot;</span>}
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>&middot;</span>
                        <Badge variant="outline" className={`${STATUS_COLORS[doc.status] || 'bg-gray-500'} text-white border-0 text-[10px] h-5`}>
                            {doc.status}
                        </Badge>
                        {doc.status === 'READY' && (
                            <span>({doc._count?.chunks || 0} chunks)</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onView}>View</Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this document?')) {
                            onDelete();
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
