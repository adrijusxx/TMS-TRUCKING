'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
    Loader2, Phone, MessageSquare, Mail, FileText, ArrowRight,
    UserPlus, Play, Clock, Send,
} from 'lucide-react';

interface Activity {
    id: string;
    type: string;
    content: string;
    createdAt: string;
    metadata?: Record<string, any>;
    user: {
        firstName: string;
        lastName: string;
    };
}

const typeConfig: Record<string, { icon: typeof Phone; color: string; borderColor: string }> = {
    CALL: { icon: Phone, color: 'text-blue-600', borderColor: 'border-blue-400' },
    SMS: { icon: MessageSquare, color: 'text-green-600', borderColor: 'border-green-400' },
    EMAIL: { icon: Mail, color: 'text-purple-600', borderColor: 'border-purple-400' },
    NOTE: { icon: FileText, color: 'text-gray-600', borderColor: 'border-gray-400' },
    STATUS_CHANGE: { icon: ArrowRight, color: 'text-orange-600', borderColor: 'border-orange-400' },
    ASSIGNMENT_CHANGE: { icon: UserPlus, color: 'text-indigo-600', borderColor: 'border-indigo-400' },
};

const defaultConfig = { icon: FileText, color: 'text-gray-600', borderColor: 'border-gray-400' };

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

export default function LeadActivityTimeline({ leadId }: { leadId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch(`/api/crm/leads/${leadId}/activities`);
                if (!res.ok) throw new Error('Failed to fetch activities');
                const data = await res.json();
                setActivities(data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (leadId) fetchActivities();
    }, [leadId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6 pl-2">
                {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No activity recorded</p>
                ) : (
                    activities.map((activity) => {
                        const config = typeConfig[activity.type] || defaultConfig;
                        const Icon = config.icon;
                        const meta = activity.metadata || {};

                        return (
                            <div
                                key={activity.id}
                                className={`relative pl-6 pb-2 border-l-2 last:border-0 ${config.borderColor}`}
                            >
                                {/* Timeline dot with icon */}
                                <div className={`absolute left-[-13px] top-0 h-6 w-6 rounded-full bg-background border-2 ${config.borderColor} flex items-center justify-center`}>
                                    <Icon className={`h-3 w-3 ${config.color}`} />
                                </div>

                                <div className="space-y-1 ml-2">
                                    {/* Type label + badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-semibold uppercase ${config.color}`}>
                                            {activity.type.replace(/_/g, ' ')}
                                        </span>
                                        {meta.sent && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                                                <Send className="h-2.5 w-2.5 mr-0.5" />
                                                Sent
                                            </Badge>
                                        )}
                                        {meta.bulk && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                Bulk
                                            </Badge>
                                        )}
                                        {meta.duration && (
                                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDuration(Number(meta.duration))}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <p className="text-sm whitespace-pre-line">{activity.content}</p>

                                    {/* Recording link */}
                                    {meta.recordingUrl && (
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" asChild>
                                            <a href={meta.recordingUrl} target="_blank" rel="noopener noreferrer">
                                                <Play className="h-3 w-3" />
                                                Play Recording
                                            </a>
                                        </Button>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{activity.user.firstName} {activity.user.lastName}</span>
                                        <span>&middot;</span>
                                        <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
}
