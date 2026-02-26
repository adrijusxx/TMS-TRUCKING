'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OverdueLead {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    nextFollowUpDate: string;
    assignedTo?: { firstName: string; lastName: string } | null;
}

interface OverdueLeadsWidgetProps {
    leads: OverdueLead[];
    isLoading: boolean;
}

export default function OverdueLeadsWidget({ leads, isLoading }: OverdueLeadsWidgetProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Overdue Follow-Ups
                    {leads.length > 0 && (
                        <Badge variant="destructive" className="ml-1 text-xs">{leads.length}</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                        ))}
                    </div>
                ) : leads.length === 0 ? (
                    <p className="text-sm text-green-600 text-center py-4">No overdue follow-ups</p>
                ) : (
                    <div className="space-y-2">
                        {leads.map((lead) => (
                            <div key={lead.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate block">
                                        {lead.firstName} {lead.lastName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {lead.assignedTo
                                            ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                                            : 'Unassigned'}
                                    </span>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                    {lead.status.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-red-500 font-medium shrink-0">
                                    {formatDistanceToNow(new Date(lead.nextFollowUpDate), { addSuffix: true })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
