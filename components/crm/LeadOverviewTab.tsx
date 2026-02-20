'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, AlertTriangle, AlertCircle, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import LeadAssignDropdown from './LeadAssignDropdown';
import LeadFollowUpScheduler from './LeadFollowUpScheduler';
import { computeLeadWarnings, getMostSevereWarning, type SLAConfig } from '@/lib/utils/lead-warnings';

interface LeadOverviewTabProps {
    leadId: string;
    leadData: any;
    onUpdated: () => void;
    onStatusChange: (status: string) => void;
    onHire: () => void;
}

/** Valid next status transitions for CDL-A driver recruiting pipeline. */
const STATUS_TRANSITIONS: Record<string, { label: string; value: string; color: string }[]> = {
    NEW: [
        { label: 'Mark Contacted', value: 'CONTACTED', color: 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30' },
        { label: 'Reject', value: 'REJECTED', color: 'bg-red-500/20 text-red-600 hover:bg-red-500/30' },
    ],
    CONTACTED: [
        { label: 'Qualify', value: 'QUALIFIED', color: 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30' },
        { label: 'Reject', value: 'REJECTED', color: 'bg-red-500/20 text-red-600 hover:bg-red-500/30' },
    ],
    QUALIFIED: [
        { label: 'Request Docs', value: 'DOCUMENTS_PENDING', color: 'bg-orange-500/20 text-orange-600 hover:bg-orange-500/30' },
        { label: 'Reject', value: 'REJECTED', color: 'bg-red-500/20 text-red-600 hover:bg-red-500/30' },
    ],
    DOCUMENTS_PENDING: [
        { label: 'Docs Collected', value: 'DOCUMENTS_COLLECTED', color: 'bg-teal-500/20 text-teal-600 hover:bg-teal-500/30' },
    ],
    DOCUMENTS_COLLECTED: [
        { label: 'Schedule Interview', value: 'INTERVIEW', color: 'bg-purple-500/20 text-purple-600 hover:bg-purple-500/30' },
    ],
    INTERVIEW: [
        { label: 'Make Offer', value: 'OFFER', color: 'bg-indigo-500/20 text-indigo-600 hover:bg-indigo-500/30' },
        { label: 'Reject', value: 'REJECTED', color: 'bg-red-500/20 text-red-600 hover:bg-red-500/30' },
    ],
    OFFER: [
        { label: 'Hire Driver', value: 'HIRED', color: 'bg-green-500/20 text-green-600 hover:bg-green-500/30' },
        { label: 'Reject', value: 'REJECTED', color: 'bg-red-500/20 text-red-600 hover:bg-red-500/30' },
    ],
};

const severityIcons = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Clock,
};

const severityColors = {
    critical: 'text-red-500 bg-red-50 dark:bg-red-950/50',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
};

export default function LeadOverviewTab({ leadId, leadData, onUpdated, onStatusChange, onHire }: LeadOverviewTabProps) {
    const { data: slaData } = useQuery({
        queryKey: ['sla-config'],
        queryFn: async () => {
            const res = await fetch('/api/crm/sla-config');
            if (!res.ok) return { configs: [] };
            return res.json();
        },
        staleTime: 300000,
    });

    const slaConfigs: SLAConfig[] = slaData?.configs || [];
    const warnings = computeLeadWarnings(leadData, slaConfigs);
    const topSeverity = getMostSevereWarning(warnings);
    const transitions = STATUS_TRANSITIONS[leadData.status] || [];

    const handleTransition = (status: string) => {
        if (status === 'HIRED') {
            onHire();
        } else {
            onStatusChange(status);
        }
    };

    return (
        <div className="space-y-4">
            {/* Row 1: Assignment + AI Score */}
            <div className="grid grid-cols-2 gap-3">
                <LeadAssignDropdown
                    leadId={leadId}
                    currentAssignee={leadData.assignedTo}
                    onAssigned={onUpdated}
                />
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> AI Score
                    </label>
                    {leadData.aiScore != null ? (
                        <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-background">
                            <span className={cn(
                                'text-lg font-bold',
                                leadData.aiScore >= 80 ? 'text-green-600' :
                                leadData.aiScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                            )}>
                                {Math.round(leadData.aiScore)}
                            </span>
                            <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                    ) : (
                        <div className="flex items-center h-9 px-3 rounded-md border bg-background text-sm text-muted-foreground">
                            Not scored
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Follow-Up */}
            <Card>
                <CardContent className="pt-4 pb-3">
                    <LeadFollowUpScheduler
                        leadId={leadId}
                        currentFollowUpDate={leadData.nextFollowUpDate}
                        currentFollowUpNote={leadData.nextFollowUpNote}
                        onUpdated={onUpdated}
                    />
                </CardContent>
            </Card>

            {/* Row 3: Warnings */}
            {warnings.length > 0 && (
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Alerts</label>
                        <div className="space-y-2">
                            {warnings.map((w, i) => {
                                const Icon = severityIcons[w.severity];
                                return (
                                    <div key={i} className={cn('flex items-start gap-2 px-3 py-2 rounded-md text-sm', severityColors[w.severity])}>
                                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{w.message}</p>
                                            {w.detail && <p className="text-xs opacity-75">{w.detail}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Row 4: Latest Note */}
            {leadData.latestNote && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Latest Note
                    </label>
                    <p className="text-sm bg-muted p-2.5 rounded-md line-clamp-3 whitespace-pre-wrap">
                        {typeof leadData.latestNote === 'string'
                            ? leadData.latestNote
                            : leadData.notes?.[0]?.content || 'No notes yet'}
                    </p>
                </div>
            )}

            {/* Row 5: Quick Status Transitions */}
            {transitions.length > 0 && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Quick Actions</label>
                    <div className="flex gap-2 flex-wrap">
                        {transitions.map((t) => (
                            <Button
                                key={t.value}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn('text-xs', t.color)}
                                onClick={() => handleTransition(t.value)}
                            >
                                {t.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
